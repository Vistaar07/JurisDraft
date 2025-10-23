import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import json
import os
import fitz  # PyMuPDF
import datetime

# --- [PART 1: DATA LOADING AND FAISS SETUP] ---

def load_corpus_from_directory(directory_path: str) -> dict:
    """Loads text from all PDF files in a directory."""
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
            except Exception as e:
                print(f"  - Failed to parse {filename}: {e}")
    print(f"Successfully loaded {len(corpus)} documents.")
    return corpus

class FaissSearcher:
    """A wrapper for creating and searching a FAISS index."""
    def __init__(self, corpus: dict, model_name='all-MiniLM-L6-v2'):
        if not corpus:
            raise ValueError("Corpus is empty.")
        
        self.corpus = corpus
        self.documents = list(corpus.values())
        self.doc_ids = list(corpus.keys())
        self.model = SentenceTransformer(model_name)
        print("Creating FAISS index from corpus embeddings...")
        embeddings = self.model.encode(self.documents)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index = faiss.IndexIDMap(self.index)
        self.index.add_with_ids(embeddings, np.array(range(len(self.documents))).astype('int64'))
        print("FAISS index is ready. ✅")

    def search(self, query: str, k: int = 1) -> list[dict]:
        """Performs a similarity search."""
        query_embedding = self.model.encode([query])
        _, I = self.index.search(query_embedding, k)
        return [{
            "doc_id": self.doc_ids[i],
            "text": self.documents[i][:400] + "..."
        } for i in I[0] if i != -1]

# --- [PART 2: CHECKLIST BLUEPRINTS] ---
# This is the core of the factory. Each key is a document type, and the value
# contains the specific topics and queries to build its checklist.

CHECKLIST_BLUEPRINTS = {
    "offer_letter": {
        "display_name": "Offer Letter",
        "governing_acts": ["The Indian Contract Act, 1872"],
        "checks": [
            {"topic": "Parties and Offer", "query": "Indian Contract Act section 10 free consent of parties competent to contract", "description": "Verify the full legal names and addresses of both the Employer and the Employee are clearly stated, constituting a valid offer to a specific person.", "risk": "High"},
            {"topic": "Consideration (Compensation)", "query": "Indian Contract Act lawful consideration employment salary", "description": "Ensure salary/compensation is explicitly stated with a clear breakdown (Basic, HRA, etc.), currency (INR), and payment frequency.", "risk": "High"},
            {"topic": "Lawful Object (Job Role)", "query": "Indian Contract Act lawful object employment role duties", "description": "Confirm a specific job title and a summary of key responsibilities are included, ensuring the object of the contract is lawful and clear.", "risk": "Medium"},
            {"topic": "Term and Duration", "query": "employment contract duration start date probation period", "description": "Verify a specific joining date, employment term (fixed/indefinite), and details of any probation period are mentioned.", "risk": "Medium"},
            {"topic": "Termination Clause", "query": "employment termination notice period India", "description": "Check for a notice period clause, specifying the duration for both employer and employee, ensuring it is reasonable.", "risk": "High"},
            {"topic": "Governing Law and Jurisdiction", "query": "contract governing law jurisdiction clause India", "description": "Confirm the presence of a 'Governing Law and Jurisdiction' clause, specifying Indian law and a specific city for jurisdiction.", "risk": "Medium"},
        ]
    },
    "nda": {
        "display_name": "Non-Disclosure Agreement (NDA)",
        "governing_acts": ["Indian Contract Act, 1872", "The IT Act, 2000"],
        "checks": [
            {"topic": "Definition of Confidential Information", "query": "NDA definition of confidential information exceptions", "description": "Analyze the definition of 'Confidential Information'. It must be specific and include reasonable exceptions (e.g., publicly known info). Check if it explicitly covers electronic records as per the IT Act.", "risk": "High"},
            {"topic": "Recipient's Obligations", "query": "IT Act 2000 section 43A reasonable security practices data protection", "description": "Verify the clause clearly states the recipient's duties: to maintain secrecy, use information only for the permitted purpose, and implement reasonable security practices.", "risk": "High"},
            {"topic": "Term of Confidentiality", "query": "NDA duration of confidentiality obligation reasonable term", "description": "Identify the term of the confidentiality obligation. It must be for a reasonable and specified duration.", "risk": "Medium"},
            {"topic": "Return/Destruction of Information", "query": "NDA return or destruction of confidential information upon termination", "description": "Confirm a clause requiring the return or destruction of all materials (including digital copies) upon termination.", "risk": "Medium"},
        ]
    },
    "non_compete_agreement": {
        "display_name": "Non-Compete Agreement",
        "governing_acts": ["Indian Contract Act, 1872 (Section 27)"],
        "checks": [
            {"topic": "Restraint of Trade (Sec 27)", "query": "Indian Contract Act Section 27 agreement in restraint of trade void", "description": "Acknowledge that the default position under Section 27 is that agreements in restraint of trade are void. The checklist must verify if the clause qualifies for any judicial exceptions.", "risk": "High"},
            {"topic": "Test of Reasonableness", "query": "judicial precedent non-compete test of reasonableness India", "description": "Verify the restriction is reasonable and necessary to protect a legitimate business interest (e.g., trade secrets).", "risk": "High"},
            {"topic": "Scope of Restrictions", "query": "non-compete agreement reasonable duration geographic scope activity", "description": "Analyze the reasonableness of the non-compete clause in three parts: duration (time), geographical area, and the scope of restricted business activities.", "risk": "High"},
        ]
    },
    "partnership_deed": {
        "display_name": "Partnership Deed",
        "governing_acts": ["The Indian Partnership Act, 1932"],
        "checks": [
            {"topic": "Firm Name and Partner Details", "query": "Indian Partnership Act 1932 firm name partner details", "description": "Verify the name of the partnership firm and the full legal names and addresses of all partners are present.", "risk": "High"},
            {"topic": "Capital Contribution", "query": "Partnership Deed capital contribution by each partner", "description": "Check that the amount of capital (cash or kind) contributed by each partner is clearly stated.", "risk": "High"},
            {"topic": "Profit and Loss Sharing Ratio", "query": "Indian Partnership Act profit and loss sharing ratio", "description": "Ensure the profit and loss sharing ratio is explicitly and unambiguously defined. If absent, the Act presumes it to be equal.", "risk": "High"},
            {"topic": "Dissolution Clause", "query": "Partnership Deed procedure for dissolution of the firm", "description": "Verify the conditions and procedures for dissolving the partnership are clearly laid out.", "risk": "High"},
        ]
    },
    # --- Add Blueprints for all other documents here ---
    "mou": {
        "display_name": "Memorandum of Understanding (MoU)",
        "governing_acts": ["Indian Contract Act, 1872"],
        "checks": [
            {"topic": "Intent and Binding Nature", "query": "MoU legally binding vs non-binding intention of parties", "description": "Crucially, verify if the MoU explicitly states which clauses (if any) are intended to be legally binding and which are non-binding statements of intent.", "risk": "High"},
            {"topic": "Purpose and Scope", "query": "Memorandum of Understanding purpose scope of collaboration", "description": "Ensure the objective and scope of the potential collaboration are clearly defined.", "risk": "Medium"},
            {"topic": "Termination/Expiry", "query": "MoU termination expiry date", "description": "Check for a clear expiry date or conditions under which the MoU will terminate.", "risk": "Medium"},
        ]
    },
    "shareholder_agreement": {
        "display_name": "Shareholder Agreement",
        "governing_acts": ["The Companies Act, 2013"],
        "checks": [
            {"topic": "Share Transfer Restrictions", "query": "Companies Act 2013 restrictions on transfer of shares right of first refusal", "description": "Verify for restrictions on share transfers, such as Right of First Refusal (ROFR) or Tag-Along/Drag-Along rights.", "risk": "High"},
            {"topic": "Decision Making & Reserved Matters", "query": "Shareholder agreement reserved matters board approval special resolution", "description": "Check for a list of 'Reserved Matters' that require a special majority or unanimous consent of shareholders.", "risk": "High"},
            {"topic": "Deadlock Resolution", "query": "shareholder agreement deadlock resolution mechanism", "description": "Verify if a mechanism to resolve deadlocks between shareholders is defined.", "risk": "High"},
        ]
    },
    "vendor_agreement": {
        "display_name": "Vendor Agreement",
        "governing_acts": ["Indian Contract Act, 1872", "The Sale of Goods Act, 1930"],
        "checks": [
            {"topic": "Scope of Work (SOW)", "query": "Vendor Agreement scope of work deliverables", "description": "Ensure the goods to be sold or services to be rendered are described with absolute clarity and specificity.", "risk": "High"},
            {"topic": "Payment and Commercials", "query": "Sale of Goods Act 1930 payment price invoicing", "description": "Verify that price, payment terms, invoicing schedule, and consequences of late payment are clearly defined.", "risk": "High"},
            {"topic": "Warranties and Representation", "query": "Sale of Goods Act implied conditions warranties quality fitness", "description": "Check for explicit warranties regarding the quality, fitness, and title of goods/services.", "risk": "Medium"},
            {"topic": "Liability and Indemnity", "query": "Vendor agreement limitation of liability indemnification clause", "description": "Analyze the limitation of liability and indemnification clauses to understand risk allocation.", "risk": "High"},
        ]
    },
    "terms_and_conditions": {
        "display_name": "Terms & Conditions (T&C)",
        "governing_acts": ["The IT Act, 2000", "IT Rules, 2021"],
        "checks": [
            {"topic": "User Agreement", "query": "IT Rules 2021 user agreement terms and conditions", "description": "Verify that the T&C are presented as a binding user agreement.", "risk": "High"},
            {"topic": "Prohibited Content/Use", "query": "IT Rules due diligence prohibited content hosting", "description": "Check for clauses that prohibit users from hosting, displaying, or sharing content that is unlawful, defamatory, obscene, etc., as required by the IT Rules.", "risk": "High"},
            {"topic": "Privacy Policy", "query": "IT Rules 2021 privacy policy personal information", "description": "Ensure the T&C references a separate, compliant Privacy Policy for handling user data.", "risk": "High"},
            {"topic": "Grievance Redressal", "query": "IT Rules 2021 Grievance Officer contact information", "description": "Verify the T&C includes the name and contact details of a Grievance Officer, as mandated by the IT Rules.", "risk": "High"},
        ]
    },
    "loan_repayment_agreement": {
        "display_name": "Loan Repayment Agreement",
        "governing_acts": ["The Negotiable Instruments Act, 1881"],
        "checks": [
            {"topic": "Principal and Interest", "query": "loan agreement principal amount interest rate calculation", "description": "Verify the principal loan amount and the exact rate of interest (and its calculation method) are clearly stated.", "risk": "High"},
            {"topic": "Repayment Schedule", "query": "loan repayment schedule EMI due dates", "description": "Ensure a detailed repayment schedule, including the number of installments (EMIs), due dates, and amounts, is present.", "risk": "High"},
            {"topic": "Default Clause", "query": "Negotiable Instruments Act 1881 default consequences penalty", "description": "Check for a clause detailing the consequences of default, including penal interest and potential legal action.", "risk": "High"},
        ]
    },
    "sale_deed": {
        "display_name": "Sale Deed",
        "governing_acts": ["The Transfer of Property Act, 1882", "The Registration Act, 1908"],
        "checks": [
            {"topic": "Parties and Property Description", "query": "Transfer of Property Act sale deed property description schedule", "description": "Verify the full details of the seller and buyer, and a complete, unambiguous description of the property (schedule of property).", "risk": "High"},
            {"topic": "Sale Consideration", "query": "sale deed sale consideration payment mode receipt", "description": "Ensure the exact sale consideration is mentioned, along with the mode of payment and an acknowledgement of receipt by the seller.", "risk": "High"},
            {"topic": "Indemnity as to Title", "query": "Transfer of Property Act seller's liability for defective title", "description": "Check for a clause where the seller indemnifies the buyer against any defects in the title of the property.", "risk": "High"},
            {"topic": "Registration Compliance", "query": "Registration Act 1908 compulsory registration of sale deed", "description": "The checklist must state that the document is incomplete and invalid until it is properly executed on stamp paper and registered at the sub-registrar's office.", "risk": "High"},
        ]
    },
    "legal_notice": {
        "display_name": "Legal Notice",
        "governing_acts": ["The Code of Civil Procedure, 1908"],
        "checks": [
            {"topic": "Parties Identification", "query": "legal notice sender recipient full address", "description": "Verify the full names and addresses of the sender (client and advocate) and the recipient are clearly stated.", "risk": "High"},
            {"topic": "Factual Narration", "query": "legal notice cause of action detailed facts", "description": "Check that the notice contains a detailed, chronological account of the facts that form the cause of action.", "risk": "Medium"},
            {"topic": "Specific Demand/Relief", "query": "Code of Civil Procedure legal notice specific relief claimed", "description": "Ensure the notice makes a clear and specific demand (e.g., 'pay the sum of INR X') and provides a deadline for compliance.", "risk": "High"},
            {"topic": "Consequences of Non-Compliance", "query": "legal notice consequences of failure to comply legal proceedings", "description": "Verify the notice clearly states the legal action (e.g., 'initiate civil proceedings') that will be taken if the demands are not met.", "risk": "High"},
        ]
    },
    "indemnity_bond": {
        "display_name": "Indemnity Bond",
        "governing_acts": ["Indian Contract Act, 1872"],
        "checks": [
            {"topic": "Indemnifier and Indemnified", "query": "Indemnity bond indemnifier indemnified party", "description": "Clearly identify the party giving the indemnity (Indemnifier) and the party being protected (Indemnified).", "risk": "High"},
            {"topic": "Scope of Indemnity", "query": "Indian Contract Act section 124 contract of indemnity losses covered", "description": "Verify that the specific losses, damages, or costs against which the indemnifier is protecting the indemnified party are clearly and specifically defined.", "risk": "High"},
        ]
    },
    "cease_and_desist": {
        "display_name": "Cease and Desist Notice",
        "governing_acts": ["The Copyright Act, 1957", "The Trademarks Act, 1999"],
        "checks": [
            {"topic": "Assertion of Rights", "query": "Copyright Act 1957 ownership of copyright trademark registration", "description": "Verify the notice clearly asserts the sender's ownership of the specific intellectual property (copyright or trademark) being infringed.", "risk": "High"},
            {"topic": "Description of Infringement", "query": "cease and desist notice specific infringing activity", "description": "Ensure the notice provides a detailed description of the specific actions by the recipient that constitute infringement.", "risk": "High"},
            {"topic": "Demand to Cease and Desist", "query": "cease and desist demand to stop infringing activity", "description": "Check for a clear and unambiguous demand that the recipient immediately stop all infringing activities.", "risk": "High"},
        ]
    }
}


# --- [PART 3: CHECKLIST GENERATION LOGIC] ---

def generate_all_checklists(searcher: FaissSearcher) -> dict:
    """
    Iterates through blueprints, uses FAISS to find evidence, and builds all checklists.
    """
    print("\n--- Generating All Checklists from Blueprints ---")
    all_checklists = {}
    
    for doc_key, blueprint in CHECKLIST_BLUEPRINTS.items():
        print(f"Processing: {blueprint['display_name']}...")
        document_checklist = []
        for check in blueprint['checks']:
            # Use the blueprint query to find supporting evidence in the corpus
            evidence_snippets = searcher.search(check['query'], k=1)
            
            # Create the final checklist item
            document_checklist.append({
                "topic": check['topic'],
                "description": check['description'],
                "risk_level": check['risk'],
                "supporting_evidence": evidence_snippets
            })
        
        all_checklists[doc_key] = {
            "display_name": blueprint['display_name'],
            "governing_acts": blueprint['governing_acts'],
            "checklist_items": document_checklist
        }
        
    print("\nAll checklists generated successfully. ✅")
    return all_checklists

# --- [PART 4: MAIN EXECUTION BLOCK] ---

if __name__ == "__main__":
    # Define the path to your legal PDFs
    CORPUS_DIRECTORY = "Acts"
    
    # Load the corpus
    corpus_data = load_corpus_from_directory(CORPUS_DIRECTORY)
    
    if corpus_data:
        # Initialize the FAISS searcher with your data
        faiss_searcher = FaissSearcher(corpus=corpus_data)
        
        # Generate all checklists based on the blueprints
        final_checklists = generate_all_checklists(faiss_searcher)
        
        # Save the complete set of checklists to a single JSON file
        output_filename = "all_document_checklists.json"
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(final_checklists, f, indent=4)
            
        print(f"\n✅ Success! All checklists have been generated and saved to '{output_filename}'.")
        print("This file can now be used by your downstream LLM.")
    else:
        print("\nExecution stopped. Could not load the legal corpus.")