import time
import math
from tqdm import tqdm
import torch
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document as LCDocument
from first_process_corpus import process_documents_from_path

"""
Rebuild vector stores using a stronger multilingual embedding model (E5).
- Model: intfloat/multilingual-e5-base
- Normalizes embeddings to unit length for cosine/IP search.
- Applies E5 instruction prefix to passages at INDEX TIME: "passage: ..."

Outputs:
- faiss_acts_e5
- faiss_judgments_e5

Usage (PowerShell):
  cd D:\JurisDraft\Backend\scripts
  python rebuild_vector_stores_e5.py

Then evaluate (PowerShell):
  cd ..\evaluation
  python run_evaluation.py \
    --faiss_a ..\scripts\faiss_acts_e5 \
    --faiss_b ..\scripts\faiss_judgments_e5 \
    --embed_model "intfloat/multilingual-e5-base" \
    --e5_instructions \
    --debug --debug_n 50 --k 10 --outdir results_debug_e5
"""

# --- 1. Paths ---
ACTS_CORPUS_PATH = "data_corpus/Acts"
JUDGMENTS_CORPUS_PATH = "data_corpus/Judgments"
FAISS_ACTS_PATH = "faiss_acts_e5"
FAISS_JUDGMENTS_PATH = "faiss_judgments_e5"

# --- 2. Embeddings init (GPU-aware) ---
print("Initializing E5 HuggingFace Embeddings model...")
model_name = "intfloat/multilingual-e5-base"
use_cuda = torch.cuda.is_available()
model_kwargs = {"device": "cuda" if use_cuda else "cpu"}
# Tune batch size for your GPU/CPU
encode_kwargs = {"batch_size": 256, "normalize_embeddings": True}
embeddings = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs)
print(f"E5 model initialized on {'CUDA' if use_cuda else 'CPU'}.")

# Optional: prefer TensorFloat32 on Ampere+ for speed
try:
    torch.set_float32_matmul_precision("high")
except Exception:
    pass


def _to_e5_passage_docs(docs: list[LCDocument]) -> list[LCDocument]:
    out: list[LCDocument] = []
    for d in docs:
        # Apply E5 passage instruction prefix
        content = d.page_content or ""
        if not content.startswith("passage:"):
            content = "passage: " + content
        out.append(LCDocument(page_content=content, metadata=d.metadata))
    return out


# --- 3. Helper to build FAISS in batches ---
def build_faiss_batched_texts(texts, metas, save_path, batch_size=1000, checkpoint_every_batches=25):
    assert len(texts) == len(metas)
    if not texts:
        return None

    # Seed the index with a tiny subset for stability
    seed_n = min(8, len(texts))
    db = FAISS.from_texts(texts[:seed_n], embeddings, metadatas=metas[:seed_n])

    pbar = tqdm(range(seed_n, len(texts), batch_size), desc="Embedding batches", unit="batch")
    for step, i in enumerate(pbar, start=1):
        j = i + batch_size
        batch_texts = texts[i:j]
        batch_metas = metas[i:j]
        if batch_texts:
            db.add_texts(batch_texts, metadatas=batch_metas)
        if step % checkpoint_every_batches == 0:
            db.save_local(save_path)
            pbar.set_postfix_str(f"checkpoint@{step}")

    db.save_local(save_path)
    return db


# --- 4. Build Acts ---
start_time = time.time()
print(f"--- Building '{FAISS_ACTS_PATH}' (E5) ---")
act_documents = process_documents_from_path(ACTS_CORPUS_PATH)
if act_documents:
    acts_e5_docs = _to_e5_passage_docs(act_documents)
    print(f"Acts chunks: {len(acts_e5_docs)}. Creating FAISS store (E5)...")
    db_acts = FAISS.from_documents(acts_e5_docs, embeddings)
    db_acts.save_local(FAISS_ACTS_PATH)
    print(f"SUCCESS: '{FAISS_ACTS_PATH}' saved.")
else:
    print(f"WARNING: No documents in {ACTS_CORPUS_PATH}. Skipping.")
print(f"--- Acts finished in {time.time() - start_time:.2f}s ---")

# --- 5. Build Judgments (large) ---
start_time = time.time()
print(f"\n--- Building '{FAISS_JUDGMENTS_PATH}' (E5) ---")
judgment_documents = process_documents_from_path(JUDGMENTS_CORPUS_PATH)
if judgment_documents:
    jd_e5_docs = _to_e5_passage_docs(judgment_documents)
    N = len(jd_e5_docs)
    print(f"Judgment chunks to embed: {N}")
    texts = [d.page_content for d in jd_e5_docs]
    metas = [d.metadata for d in jd_e5_docs]

    # Choose batch size for FAISS ingestion (independent of encoder batch)
    faiss_batch = 1000  # adjust 500–3000 depending on RAM
    print("Creating FAISS vector store for Judgments (E5) in batches... THIS WILL TAKE A LONG TIME.")
    db_j = build_faiss_batched_texts(texts, metas, FAISS_JUDGMENTS_PATH, batch_size=faiss_batch, checkpoint_every_batches=20)
    print(f"SUCCESS: '{FAISS_JUDGMENTS_PATH}' saved.")
else:
    print(f"WARNING: No documents in {JUDGMENTS_CORPUS_PATH}. Skipping.")
print(f"--- Judgments finished in {time.time() - start_time:.2f}s ---")

print("\n--- All E5 vector stores built! ---")
