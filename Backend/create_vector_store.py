import pickle
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
 
# --- 1. Load the processed documents ---
PROCESSED_DATA_FILE = "processed_corpus_22_OCT.pkl"
print(f"Loading processed documents from {PROCESSED_DATA_FILE}...")
with open(PROCESSED_DATA_FILE, 'rb') as f:
    all_documents = pickle.load(f)
 
if not all_documents:
    raise ValueError("No documents found in the processed file. Please run process_acts.py first.")
 
print(f"Loaded {len(all_documents)} document chunks.")
 
# --- 2. Initialize the Local Embedding Model ---
# This model will be downloaded automatically the first time you run it.
print("Initializing local HuggingFace Embeddings model...")
model_name = "sentence-transformers/all-MiniLM-L6-v2"
# On a Macbook Air, 'cpu' is the correct device.
model_kwargs = {'device': 'cpu'}
embeddings = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs)
print("Local model initialized successfully.")
 
# --- 3. Create the FAISS vector store ---
print("Creating FAISS vector store... This may take a moment.")
db = FAISS.from_documents(all_documents, embeddings)
print("Vector store created successfully.")
 
# --- 4. Save the vector store locally ---
FAISS_INDEX_PATH = "faiss_index_22_OCT"
db.save_local(FAISS_INDEX_PATH)
print(f"FAISS index has been saved to '{FAISS_INDEX_PATH}'.")
 