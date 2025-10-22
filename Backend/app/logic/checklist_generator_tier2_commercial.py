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
    print(f"Successfully loaded {len(corpus)} documents for Tier 2 analysis.")
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

# --- [PART 2: TIER 2 CHECKLIST BLUEPRINTS] ---
# These blueprints focus exclusively on Commercial & Operational Soundness.

CHECKLIST_BLUEPRINTS_TIER2 = {
    "offer_letter": { "display_name": "Offer Letter", "checks": [
        {"topic": "Clarity of Performance Metrics", "query": "offer letter performance bonus key performance indicators KPI", "description": "If a performance bonus is mentioned, are the Key Performance Indicators (KPIs) objective, measurable, and clearly defined, or are they subjective ('at the discretion of management')?", "risk": "Medium"},
        {"topic": "Fairness of Notice Period", "query": "employment agreement reasonable notice period", "description": "Is the notice period reciprocal and fair for both the employer and employee? Flag excessively long notice periods that can trap an employee.", "risk": "Medium"},
    ]},
    "nda": { "display_name": "Non-Disclosure Agreement (NDA)", "checks": [
        {"topic": "Practicality of 'Permitted Purpose'", "query": "NDA permitted purpose definition scope", "description": "Is the 'Permitted Purpose' for using the confidential information clearly defined? An overly narrow definition can hinder business operations.", "risk": "Medium"},
        {"topic": "Mutual vs. One-Sided Obligations", "query": "mutual vs unilateral one-sided NDA obligations", "description": "Analyze if the confidentiality obligations are mutual. If it's a one-sided NDA, is that commercially justified in this context?", "risk": "Medium"},
    ]},
    "non_compete_agreement": { "display_name": "Non-Compete Agreement", "checks": [
        {"topic": "Fairness of Consideration", "query": "non-compete agreement consideration for restraint of trade", "description": "Is the company providing fair consideration (e.g., specific payment, access to valuable trade secrets) specifically for the non-compete obligation?", "risk": "High"},
    ]},
    "partnership_deed": { "display_name": "Partnership Deed", "checks": [
        {"topic": "Decision-Making Efficiency", "query": "partnership deed management voting rights deadlock", "description": "Is the decision-making process (e.g., majority vote, unanimous consent) clear and efficient, or is it likely to lead to frequent deadlocks?", "risk": "High"},
        {"topic": "Segregation of Duties", "query": "partnership deed partner roles and responsibilities", "description": "Are the roles and responsibilities of each partner clearly defined to prevent operational conflicts and overlaps?", "risk": "Medium"},
    ]},
    "mou": { "display_name": "Memorandum of Understanding (MoU)", "checks": [
        {"topic": "Realistic Timelines", "query": "MoU timeline for definitive agreement", "description": "Does the MoU set out a realistic timeline and next steps for entering into a definitive, binding agreement?", "risk": "Low"},
    ]},
    "shareholder_agreement": { "display_name": "Shareholder Agreement", "checks": [
        {"topic": "Fairness of Valuation Method", "query": "shareholder agreement share valuation method buyout", "description": "For any buyout or exit clauses, is the method for valuing shares clearly defined and based on fair market principles?", "risk": "High"},
    ]},
    "vendor_agreement": { "display_name": "Vendor Agreement", "checks": [
        {"topic": "Achievability of SLAs", "query": "vendor agreement Service Level Agreement SLA uptime response time", "description": "Are the Service Level Agreements (SLAs) realistic and achievable? Are the penalties for non-performance proportionate to the breach?", "risk": "High"},
        {"topic": "Clarity of Acceptance Criteria", "query": "vendor agreement acceptance criteria objective subjective", "description": "Are the criteria for 'accepting' deliverables objective and measurable to prevent payment disputes?", "risk": "High"},
    ]},
    "terms_and_conditions": { "display_name": "Terms & Conditions (T&C)", "checks": [
        {"topic": "Readability and Clarity", "query": "terms and conditions plain language simple clear", "description": "Is the language clear and easily understandable for a typical user, or is it filled with dense, confusing legal jargon?", "risk": "Medium"},
        {"topic": "Fairness of Term Updates", "query": "terms and conditions right to modify terms unilateral changes", "description": "Does the company reserve the right to change terms unilaterally? If so, is the process for notifying users fair and transparent?", "risk": "Medium"},
    ]},
    "loan_repayment_agreement": { "display_name": "Loan Repayment Agreement", "checks": [
        {"topic": "Hidden Fees and Charges", "query": "loan agreement processing fees hidden charges", "description": "Scrutinize the agreement for any hidden fees, processing charges, or other costs not included in the interest rate.", "risk": "High"},
    ]},
    "sale_deed": { "display_name": "Sale Deed", "checks": [
        {"topic": "Allocation of Liabilities", "query": "sale deed property tax maintenance charges electricity dues", "description": "Are all existing liabilities (e.g., unpaid property taxes, society dues, utility bills) clearly quantified and allocated between the buyer and seller?", "risk": "High"},
    ]},
    "legal_notice": { "display_name": "Legal Notice", "checks": [
        {"topic": "Tone and Negotiation Space", "query": "legal notice tone professional firm negotiation", "description": "Is the tone of the notice firm but professional? Does it unnecessarily close the door to negotiation or settlement?", "risk": "Low"},
    ]},
    "indemnity_bond": { "display_name": "Indemnity Bond", "checks": [
        {"topic": "Commercial Reasonableness", "query": "indemnity bond scope of indemnity unlimited liability", "description": "Is the scope of the indemnity commercially reasonable, or is it excessively broad, creating unlimited liability for the indemnifier?", "risk": "High"},
    ]},
    "cease_and_desist": { "display_name": "Cease and Desist Notice", "checks": [
        {"topic": "Strength of Evidence", "query": "cease and desist evidence of infringement", "description": "Does the notice reference strong, specific evidence of infringement, or does it rely on vague accusations?", "risk": "Medium"},
    ]}
}

def generate_checklist(searcher: FaissSearcher) -> dict:
    print("\n--- Generating Tier 2 Checklist ---")
    all_checklists = {}
    for doc_key, blueprint in CHECKLIST_BLUEPRINTS_TIER2.items():
        document_checklist = []
        for check in blueprint["checks"]:
            evidence_snippets = searcher.search(check['query'], k=1)
            document_checklist.append({
                "topic": check['topic'],
                "description": check['description'],
                "risk_level": check['risk'],
                "supporting_evidence": evidence_snippets,
                "layer": 2
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
            "tier_level": 2,
            "tier_name": "Commercial & Operational Soundness",
            "generated_at": datetime.datetime.now().isoformat(),
            "checklists": final_checklists
        }
        
        output_filename = "tier2_commercial_checklist.json"
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=4)
        print(f"\n✅ Success! Tier 2 checklist saved to '{output_filename}'.")