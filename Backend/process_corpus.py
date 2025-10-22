import os
import fitz  # PyMuPDF
import json
import re
import pickle
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document

# --- Configuration ---
ACTS_DIR = "Acts/"
CASE_LAW_DIR = "CaseLawData/"
OUTPUT_FILE = "processed_corpus.pkl"

# --- Text Processing Functions (from your original script) ---
def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def clean_text(text):
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

# --- NEW Function to Process Case Law JSON ---
def extract_text_from_json(json_path):
    """Extracts the main document text from an Indian Kanoon JSON file."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # The main judgment text is in the 'doc' key
        return data.get("doc", "")
    except (json.JSONDecodeError, IOError) as e:
        print(f"  Warning: Could not read or parse {json_path}. Skipping. Error: {e}")
        return None

# --- Main Script Logic ---
if __name__ == "__main__":
    all_documents = []

    # --- Initialize the Text Splitter ---
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", ", ", " "],
    )

    # --- 1. Process the original Legal Acts ---
    print("--- Phase 1: Processing Legal Acts ---")
    if os.path.isdir(ACTS_DIR):
        for filename in os.listdir(ACTS_DIR):
            if filename.endswith(".pdf"):
                print(f"Processing Act: {filename}")
                pdf_path = os.path.join(ACTS_DIR, filename)
                raw_text = extract_text_from_pdf(pdf_path)
                cleaned_text = clean_text(raw_text)
                chunks = text_splitter.split_text(cleaned_text)
                
                for i, chunk_text in enumerate(chunks):
                    doc = Document(
                        page_content=chunk_text,
                        metadata={"source": filename, "type": "Legal Act"}
                    )
                    all_documents.append(doc)
    else:
        print(f"Warning: Directory '{ACTS_DIR}' not found. Skipping legal acts.")

    # --- 2. Process the downloaded Case Law ---
    print("\n--- Phase 2: Processing Case Law ---")
    if os.path.isdir(CASE_LAW_DIR):
        # The os.walk function is perfect for navigating the deep folder structure
        for root, dirs, files in os.walk(CASE_LAW_DIR):
            for filename in files:
                if filename.endswith(".json"):
                    print(f"Processing Case: {filename}")
                    json_path = os.path.join(root, filename)
                    raw_text = extract_text_from_json(json_path)
                    
                    if raw_text:
                        cleaned_text = clean_text(raw_text)
                        chunks = text_splitter.split_text(cleaned_text)
                        
                        for i, chunk_text in enumerate(chunks):
                            doc = Document(
                                page_content=chunk_text,
                                metadata={"source": filename, "type": "Case Law"}
                            )
                            all_documents.append(doc)
    else:
        print(f"Warning: Directory '{CASE_LAW_DIR}' not found. Skipping case law.")

    # --- 3. Save the combined corpus ---
    print(f"\n--- Finalizing ---")
    print(f"Created a total of {len(all_documents)} document chunks from all sources.")

    with open(OUTPUT_FILE, 'wb') as f:
        pickle.dump(all_documents, f)

    print(f"Combined corpus saved to '{OUTPUT_FILE}'.")
    print("Next step: Run the 'create_vector_store.py' script on this new file to build your final FAISS index.")