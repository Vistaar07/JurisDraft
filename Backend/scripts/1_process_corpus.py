import fitz  # PyMuPDF
import os
import re
import pickle
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document

def extract_text_from_pdf(pdf_path):
    """Extracts text from a PDF file, preserving some structure."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def clean_text(text):
    """A more gentle text cleaning function."""
    # Replace multiple newlines with a single one to preserve paragraphs
    text = re.sub(r'\n\s*\n', '\n\n', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

# --- Main script logic ---
SOURCE_DIR = "Acts/"
PROCESSED_DATA_FILE = "processed_documents.pkl"

# --- Initialize the splitter ---
# This splitter tries to break text at paragraph breaks, then lines, then sentences.
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,     # Increased chunk size for potentially complex legal sections
    chunk_overlap=150,   # Increased overlap to maintain context between chunks
    length_function=len,
    separators=["\n\n", "\n", ". ", ", ", " "], # Explicitly define separators
)

all_documents = []

# Loop through your downloaded files
print("Starting processing of files in Acts/ folder...")
for filename in os.listdir(SOURCE_DIR):
    if not filename.endswith(".pdf"):
        continue

    input_path = os.path.join(SOURCE_DIR, filename)
    print(f"Processing: {filename}")
    
    # 1. Extract Text
    raw_text = extract_text_from_pdf(input_path)
    
    # 2. Clean Text
    cleaned_text = clean_text(raw_text)
    
    # 3. Split Text into Chunks
    chunks = text_splitter.split_text(cleaned_text)
    
    # 4. Create Document objects with metadata
    for i, chunk_text in enumerate(chunks):
        doc = Document(
            page_content=chunk_text,
            metadata={
                "source_document": filename,
                "chunk_index": i
            }
        )
        all_documents.append(doc)

print(f"\nCreated a total of {len(all_documents)} documents from all files.")

# 5. Save the processed documents for the next phase
with open(PROCESSED_DATA_FILE, 'wb') as f:
    pickle.dump(all_documents, f)

print(f"All processed documents saved to '{PROCESSED_DATA_FILE}'.")
