import time
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
# Import our new processing function
from scripts.1_process_corpus import process_documents_from_path

# --- 1. Define Paths ---
ACTS_CORPUS_PATH = "data_corpus/Acts"
JUDGMENTS_CORPUS_PATH = "data_corpus/Judgments"

FAISS_ACTS_PATH = "faiss_acts"
FAISS_JUDGMENTS_PATH = "faiss_judgments"

# --- 2. Initialize Embeddings (as before) ---
print("Initializing local HuggingFace Embeddings model...")
model_name = "sentence-transformers/all-MiniLM-L6-v2"
model_kwargs = {'device': 'cpu'} # For your Macbook Air
embeddings = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs)
print("Local model initialized successfully.")

# --- 3. Process and Build ACTS Vector Store ---
start_time = time.time()
print(f"--- Building '{FAISS_ACTS_PATH}' ---")
act_documents = process_documents_from_path(ACTS_CORPUS_PATH)

if act_documents:
    print(f"Creating FAISS vector store for Acts... This may take a moment.")
    db_acts = FAISS.from_documents(act_documents, embeddings)
    db_acts.save_local(FAISS_ACTS_PATH)
    print(f"SUCCESS: FAISS index for Acts saved to '{FAISS_ACTS_PATH}'")
else:
    print(f"WARNING: No documents found in {ACTS_CORPUS_PATH}. Skipping.")
print(f"--- Acts build finished in {time.time() - start_time:.2f} seconds ---")


# --- 4. Process and Build JUDGMENTS Vector Store ---
start_time = time.time()
print(f"\n--- Building '{FAISS_JUDGMENTS_PATH}' ---")
judgment_documents = process_documents_from_path(JUDGMENTS_CORPUS_PATH)

if judgment_documents:
    print(f"Creating FAISS vector store for Judgments... THIS WILL TAKE A LONG TIME.")
    db_judgments = FAISS.from_documents(judgment_documents, embeddings)
    db_judgments.save_local(FAISS_JUDGMENTS_PATH)
    print(f"SUCCESS: FAISS index for Judgments saved to '{FAISS_JUDGMENTS_PATH}'")
else:
    print(f"WARNING: No documents found in {JUDGMENTS_CORPUS_PATH}. Skipping.")
print(f"--- Judgments build finished in {time.time() - start_time:.2f} seconds ---")

print("\n--- All vector stores built! ---")