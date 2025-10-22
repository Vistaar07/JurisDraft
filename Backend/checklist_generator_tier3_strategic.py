import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import json
import os
import fitz  # PyMuPDF
import datetime

# --- [PART 1: DATA LOADING AND FAISS SETUP] ---
# This setup remains the same, as it needs to access your corpus.

def load_corpus_from_directory(directory_path: str) -> dict:
    print(f"Loading legal corpus from: '{directory_path}'...")
    corpus = {}
    if not os.path.exists(directory_path):
        print(f"Error: Directory '{directory_path}' not found.")
        return corpus
    for filename in os.listdir(directory_path):
        if filename.lower().endswith(".pdf"):
            try:
                doc_path = os.path.join(directory_path, filename)
                text = "".join(page.get_text() for page in fitz.open(doc_path))
                corpus[filename] = text
            except Exception as e: print(f"  - Failed to parse {filename}: {e}")
    print(f"Successfully loaded {len(corpus)} documents for Tier 3 analysis.")
    return corpus

class FaissSearcher:
    def __init__(self, corpus: dict, model_name='all-MiniLM-L6-v2'):
        if not corpus: raise ValueError("Corpus is empty.")
        self.corpus, self.documents, self.doc_ids = corpus, list(corpus.values()), list(corpus.keys())
        self.model = SentenceTransformer(model_name)
        print("Creating FAISS index...")
        embeddings = self.model.encode(self.documents)
        self.index = faiss.IndexIDMap(faiss.IndexFlatL2(embeddings.shape[1]))
        self.index.add_with_ids(embeddings, np.array(range(len(self.documents))).astype('int64'))
        print("FAISS index is ready. ✅")

    def search(self, query: str, k: int = 1) -> list[dict]:
        query_embedding = self.model.encode([query])
        _, I = self.index.search(query_embedding, k)
        return [{"doc_id": self.doc_ids[i], "text": self.documents[i][:400] + "..."} for i in I[0] if i != -1]

# --- [PART 2: TIER 3 CHECKLIST BLUEPRINTS] ---
# These blueprints focus exclusively on Strategic & Future-Proofing.

CHECKLIST_BLUEPRINTS_TIER3 = {
    "offer_letter": { "display_name": "Offer Letter", "checks": [
        {"topic": "Future IP Assignment", "query": "employment agreement intellectual property assignment future inventions", "description": "Does the IP assignment clause cover not only inventions made during employment but also for a reasonable period after, related to the company's business?", "risk": "Medium"},
        {"topic": "Long-Term Incentives", "query": "offer letter Employee Stock Option Plan ESOPs", "description": "Does the agreement include provisions for long-term incentives like Employee Stock Options (ESOPs) to align employee goals with company growth?", "risk": "Low"},
    ]},
    "nda": { "display_name": "Non-Disclosure Agreement (NDA)", "checks": [
        {"topic": "M&A and Change of Control", "query": "NDA change of control merger acquisition assignment", "description": "Does the NDA clarify what happens to the confidentiality obligations if one of the parties is acquired or undergoes a merger?", "risk": "Medium"},
    ]},
    "non_compete_agreement": { "display_name": "Non-Compete Agreement", "checks": [
        {"topic": "Adaptability to Market Changes", "query": "non-compete evolving market future business", "description": "Is the definition of 'competing business' flexible enough to cover future market evolutions without being overly broad?", "risk": "Medium"},
    ]},
    "partnership_deed": { "display_name": "Partnership Deed", "checks": [
        {"topic": "Continuity and Succession", "query": "partnership deed key person insurance partner retirement succession", "description": "Does the deed include provisions for business continuity, such as 'key person' insurance or a clear succession plan if a partner exits?", "risk": "High"},
        {"topic": "Future Partner Admission", "query": "partnership deed admission of new partner capital contribution", "description": "Is there a defined process for admitting new partners in the future, including capital contribution and profit-sharing adjustments?", "risk": "Medium"},
    ]},
    "mou": { "display_name": "Memorandum of Understanding (MoU)", "checks": [
        {"topic": "Exclusivity Period", "query": "MoU exclusivity clause no-shop provision", "description": "Does the MoU include an 'exclusivity' or 'no-shop' clause, preventing the other party from negotiating with competitors for a fixed period?", "risk": "Medium"},
    ]},
    "shareholder_agreement": { "display_name": "Shareholder Agreement", "checks": [
        {"topic": "Future Funding Rounds", "query": "shareholder agreement anti-dilution rights future financing", "description": "Does the agreement contain anti-dilution provisions to protect existing shareholders' stake during future funding rounds?", "risk": "High"},
    ]},
    "vendor_agreement": { "display_name": "Vendor Agreement", "checks": [
        {"topic": "Scalability and Pricing", "query": "vendor agreement scalable pricing model volume discounts", "description": "Is the pricing model scalable? Does it include provisions for volume discounts or renegotiation if the user's business grows significantly?", "risk": "Medium"},
        {"topic": "Technology Evolution", "query": "vendor agreement technology upgrades future-proofing", "description": "Does the agreement oblige the vendor to provide technology upgrades or ensure their service remains compatible with future industry standards?", "risk": "Medium"},
    ]},
    "terms_and_conditions": { "display_name": "Terms & Conditions (T&C)", "checks": [
        {"topic": "Future Data Use Rights", "query": "terms and conditions right to use anonymized aggregated data analytics", "description": "Does the T&C grant the company the right to use anonymized and aggregated user data for future analytics, AI training, or product development?", "risk": "Medium"},
    ]},
    "loan_repayment_agreement": { "display_name": "Loan Repayment Agreement", "checks": [
        {"topic": "Prepayment Flexibility", "query": "loan agreement prepayment clause foreclosure penalty", "description": "Are there provisions for early repayment (prepayment) of the loan? If so, are any prepayment penalties commercially reasonable?", "risk": "Medium"},
    ]},
    "sale_deed": { "display_name": "Sale Deed", "checks": [
        {"topic": "Future Development Rights", "query": "sale deed future development rights zoning changes", "description": "Does the deed address any future development rights, potential zoning changes, or upcoming infrastructure projects that could affect the property's value?", "risk": "Low"},
    ]},
    "legal_notice": { "display_name": "Legal Notice", "checks": [
        {"topic": "Preservation of Future Claims", "query": "legal notice reservation of rights without prejudice", "description": "Does the notice include 'without prejudice' and 'reservation of rights' language to ensure it doesn't limit future legal arguments or claims?", "risk": "Medium"},
    ]},
    "indemnity_bond": { "display_name": "Indemnity Bond", "checks": [
        {"topic": "Survival Clause", "query": "indemnity survival after termination of contract", "description": "Does the indemnity obligation survive the termination of the primary contract for a reasonable period, protecting against latent defects or claims?", "risk": "Medium"},
    ]},
    "cease_and_desist": { "display_name": "Cease and Desist Notice", "checks": [
        {"topic": "Reservation of Future Damages", "query": "cease and desist reservation of rights to claim future damages", "description": "Does the notice reserve the right to claim for damages discovered in the future that resulted from the infringing activity?", "risk": "Medium"},
    ]}
}

def generate_checklist(searcher: FaissSearcher) -> dict:
    print("\n--- Generating Tier 3 Checklist ---")
    all_checklists = {}
    for doc_key, blueprint in CHECKLIST_BLUEPRINTS_TIER3.items():
        document_checklist = []
        for check in blueprint["checks"]:
            evidence_snippets = searcher.search(check['query'], k=1)
            document_checklist.append({
                "topic": check['topic'],
                "description": check['description'],
                "risk_level": check['risk'],
                "supporting_evidence": evidence_snippets,
                "layer": 3
            })
        all_checklists[doc_key] = {
            "display_name": blueprint['display_name'],
            "checklist_items": document_checklist
        }
    return all_checklists

if __name__ == "__main__":
    CORPUS_DIRECTORY = "Acts"
    corpus_data = load_corpus_from_directory(CORPUS_DIRECTORY)
    if corpus_data:
        faiss_searcher = FaissSearcher(corpus=corpus_data)
        final_checklists = generate_checklist(faiss_searcher)
        
        output_data = {
            "tier_level": 3,
            "tier_name": "Strategic & Future-Proofing",
            "generated_at": datetime.datetime.now().isoformat(),
            "checklists": final_checklists
        }
        
        output_filename = "tier3_strategic_checklist.json"
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=4)
        print(f"\n✅ Success! Tier 3 checklist saved to '{output_filename}'.")