import time
import math
from tqdm import tqdm
import torch
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from first_process_corpus import process_documents_from_path

# --- 1. Paths ---
ACTS_CORPUS_PATH = "data_corpus/Acts"
JUDGMENTS_CORPUS_PATH = "data_corpus/Judgments"
FAISS_ACTS_PATH = "faiss_acts"
FAISS_JUDGMENTS_PATH = "faiss_judgments"

# --- 2. Embeddings init (GPU-aware) ---
print("Initializing local HuggingFace Embeddings model...")
model_name = "sentence-transformers/all-MiniLM-L6-v2"
use_cuda = torch.cuda.is_available()
model_kwargs = {"device": "cuda" if use_cuda else "cpu"}
# Tune batch size: 256–1024 for A-series/30xx/40xx cards, 64–128 on low VRAM
encode_kwargs = {"batch_size": 512, "normalize_embeddings": True}
embeddings = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs)
print(f"Local model initialized on {'CUDA' if use_cuda else 'CPU'}.")

# Optional: prefer TensorFloat32 on Ampere+ for speed
try:
    torch.set_float32_matmul_precision("high")
except Exception:
    pass

# --- 3. Helper to build FAISS in batches ---
def build_faiss_batched(texts, metas, save_path, batch_size=1000, checkpoint_every_batches=25):
    assert len(texts) == len(metas)
    if not texts:
        return None

    # Seed the index with a tiny subset
    seed_n = min(8, len(texts))
    db = FAISS.from_texts(texts[:seed_n], embeddings, metadatas=metas[:seed_n])

    pbar = tqdm(range(seed_n, len(texts), batch_size), desc="Embedding batches", unit="batch")
    for step, i in enumerate(pbar, start=1):
        j = i + batch_size
        batch_texts = texts[i:j]
        batch_metas = metas[i:j]
        db.add_texts(batch_texts, metadatas=batch_metas)

        if step % checkpoint_every_batches == 0:
            db.save_local(save_path)
            pbar.set_postfix_str(f"checkpoint@{step}")

    db.save_local(save_path)
    return db

# --- 4. Build Acts (usually small) ---
start_time = time.time()
print(f"--- Building '{FAISS_ACTS_PATH}' ---")
act_documents = process_documents_from_path(ACTS_CORPUS_PATH)
if act_documents:
    print(f"Acts chunks: {len(act_documents)}. Creating FAISS store...")
    db_acts = FAISS.from_documents(act_documents, embeddings)
    db_acts.save_local(FAISS_ACTS_PATH)
    print(f"SUCCESS: '{FAISS_ACTS_PATH}' saved.")
else:
    print(f"WARNING: No documents in {ACTS_CORPUS_PATH}. Skipping.")
print(f"--- Acts finished in {time.time() - start_time:.2f}s ---")

# --- 5. Build Judgments (very large) ---
start_time = time.time()
print(f"\n--- Building '{FAISS_JUDGMENTS_PATH}' ---")
judgment_documents = process_documents_from_path(JUDGMENTS_CORPUS_PATH)
if judgment_documents:
    N = len(judgment_documents)
    print(f"Judgment chunks to embed: {N}")
    texts = [d.page_content for d in judgment_documents]
    metas = [d.metadata for d in judgment_documents]

    # Choose batch size for FAISS ingestion (independent of encoder batch)
    faiss_batch = 1000  # adjust 500–3000 depending on RAM
    print("Creating FAISS vector store for Judgments in batches... THIS WILL TAKE A LONG TIME.")
    db_j = build_faiss_batched(texts, metas, FAISS_JUDGMENTS_PATH, batch_size=faiss_batch, checkpoint_every_batches=20)
    print(f"SUCCESS: '{FAISS_JUDGMENTS_PATH}' saved.")
else:
    print(f"WARNING: No documents in {JUDGMENTS_CORPUS_PATH}. Skipping.")
print(f"--- Judgments finished in {time.time() - start_time:.2f}s ---")

print("\n--- All vector stores built! ---")