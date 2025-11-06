"""
API for Legal Document Generation
File: api_document_generation.py
Endpoint: POST /generate - Generate legal documents using checklist + FAISS retrieval
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import traceback

# Import document generator
from rag_config import create_document_generator


# ============================================================================
# API Models
# ============================================================================

class DocumentGenerationRequest(BaseModel):
    """Request model for document generation"""
    document_type: str = Field(description="Type of document (e.g., 'nda', 'offer_letter')")
    user_inputs: Dict[str, Any] = Field(description="User-provided details for the document")
    jurisdiction: str = Field(default="India", description="Legal jurisdiction (India only)")
    output_format: str = Field(default="markdown", description="Output format: markdown | html | text")
    include_sources: bool = Field(default=True, description="Include References section with sources")

    class Config:
        json_schema_extra = {
            "example": {
                "document_type": "nda",
                "user_inputs": {
                    "party_a": "TechCorp India Pvt. Ltd.",
                    "party_a_address": "123 Tech Park, Bangalore",
                    "party_b": "John Doe",
                    "party_b_address": "456 Residency Road, Bangalore",
                    "purpose": "Evaluating potential business partnership",
                    "term": "3 years",
                    "effective_date": "November 6, 2025"
                },
                "jurisdiction": "India",
                "output_format": "markdown",
                "include_sources": True
            }
        }


class DocumentGenerationResponse(BaseModel):
    """Response model for document generation"""
    success: bool
    document_type: str
    document_text: str
    checklist_items_included: int
    governing_acts: List[str]
    metadata: Dict[str, Any]


class AvailableDocumentType(BaseModel):
    """Information about a document type"""
    document_type: str
    display_name: str
    governing_acts: List[str]
    required_inputs: List[str]
    checklist_items_count: int


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="JurisDraft Document Generation API",
    description="API for generating legal documents with checklist integration and FAISS retrieval",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        # Add your production URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize document generator
print("Initializing document generator...")
try:
    generator = create_document_generator()
    print("✓ Document generator initialized successfully")
except Exception as e:
    print(f"⚠️ Warning: Document generator initialization error: {e}")
    generator = None


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "JurisDraft Document Generation API",
        "version": "1.0.0",
        "status": "operational" if generator else "degraded",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if generator is None:
        return {
            "status": "degraded",
            "message": "Document generator not initialized",
            "components": {
                "generator": False,
                "vectorstore_acts": False,
                "checklists": False
            }
        }

    return {
        "status": "healthy",
        "message": "All systems operational",
        "components": {
            "generator": True,
            "vectorstore_acts": generator.config.vectorstore_acts is not None,
            "vectorstore_judgments": generator.config.vectorstore_judgments is not None,
            "checklists": len(generator.checklists)
        }
    }


@app.post("/generate", response_model=DocumentGenerationResponse)
async def generate_document(request: DocumentGenerationRequest):
    """
    Generate a legal document using checklist requirements and FAISS-retrieved legal provisions

    The generation process:
    1. Retrieves relevant legal provisions from FAISS acts database
    2. Loads checklist requirements for the document type
    3. Combines retrieved provisions + checklist + user inputs
    4. Uses LLM to generate compliant document

    Args:
        request: Document generation request with type, inputs, and jurisdiction

    Returns:
        Generated document with metadata
    """
    if generator is None:
        raise HTTPException(
            status_code=503,
            detail="Document generator not initialized. Please check server logs."
        )

    try:
        # Enforce jurisdiction India
        if request.jurisdiction.strip().lower() != "india":
            raise HTTPException(status_code=400, detail="Only Indian legal domain is supported. Set jurisdiction='India'.")

        # Validate document type
        doc_type_key = request.document_type.lower().replace(" ", "_")
        if doc_type_key not in generator.checklists:
            available_types = list(generator.checklists.keys())
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type. Available types: {available_types}"
            )

        # Validate user inputs
        if not request.user_inputs:
            raise HTTPException(
                status_code=400,
                detail="user_inputs cannot be empty. Provide at least basic details."
            )

        # Validate output format
        if request.output_format not in {"markdown", "html", "text"}:
            raise HTTPException(status_code=400, detail="Invalid output_format. Use: markdown | html | text")

        # Get checklist data
        checklist_data = generator.checklists[doc_type_key]

        # Generate document
        print(f"Generating {request.document_type}...")
        document_text = generator.generate_document(
            document_type=request.document_type,
            user_inputs=request.user_inputs,
            jurisdiction=request.jurisdiction,
            output_format=request.output_format,
            include_sources=request.include_sources
        )

        # Prepare response
        return DocumentGenerationResponse(
            success=True,
            document_type=request.document_type,
            document_text=document_text,
            checklist_items_included=len(checklist_data.get("checklist_items", [])),
            governing_acts=checklist_data.get("governing_acts", []),
            metadata={
                "jurisdiction": request.jurisdiction,
                "generated_on": __import__("datetime").date.today().isoformat(),
                "character_count": len(document_text),
                "word_count": len(document_text.split()),
                "output_format": request.output_format,
                "include_sources": request.include_sources
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in document generation: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Document generation failed: {str(e)}"
        )


@app.get("/document-types", response_model=List[AvailableDocumentType])
async def get_document_types():
    """
    Get list of available document types with metadata

    Returns information about all supported document types including:
    - Display name
    - Governing acts
    - Required input fields
    - Number of checklist items
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")

    document_types = []

    for doc_type, data in generator.checklists.items():
        # Suggest required inputs based on common patterns
        required_inputs = _get_suggested_inputs(doc_type)

        document_types.append(AvailableDocumentType(
            document_type=doc_type,
            display_name=data.get("display_name", doc_type.replace("_", " ").title()),
            governing_acts=data.get("governing_acts", []),
            required_inputs=required_inputs,
            checklist_items_count=len(data.get("checklist_items", []))
        ))

    return document_types


@app.get("/document-types/{document_type}")
async def get_document_type_details(document_type: str):
    """
    Get detailed information about a specific document type

    Includes:
    - Display name
    - Governing acts
    - Full checklist items with descriptions
    - Suggested input fields
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")

    doc_type_key = document_type.lower().replace(" ", "_")

    if doc_type_key not in generator.checklists:
        raise HTTPException(
            status_code=404,
            detail=f"Document type '{document_type}' not found"
        )

    data = generator.checklists[doc_type_key]

    return {
        "document_type": doc_type_key,
        "display_name": data.get("display_name", ""),
        "governing_acts": data.get("governing_acts", []),
        "checklist_items": data.get("checklist_items", []),
        "suggested_inputs": _get_suggested_inputs(doc_type_key),
        "checklist_count": len(data.get("checklist_items", []))
    }


@app.post("/preview-checklist")
async def preview_checklist(document_type: str):
    """
    Preview checklist items that will be used in document generation

    Shows all requirements that the generated document will address
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")

    doc_type_key = document_type.lower().replace(" ", "_")

    if doc_type_key not in generator.checklists:
        raise HTTPException(
            status_code=404,
            detail=f"Document type '{document_type}' not found"
        )

    data = generator.checklists[doc_type_key]

    return {
        "document_type": doc_type_key,
        "display_name": data.get("display_name", ""),
        "governing_acts": data.get("governing_acts", []),
        "checklist_items": [
            {
                "topic": item.get("topic", ""),
                "description": item.get("description", ""),
                "risk_level": item.get("risk_level", "")
            }
            for item in data.get("checklist_items", [])
        ]
    }


@app.get("/document-types/schema/{document_type}")
async def get_document_type_schema(document_type: str):
    """Return suggested input schema (fields) for a doc type to guide frontend forms."""
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")
    key = document_type.lower().replace(" ", "_")
    if key not in generator.checklists:
        raise HTTPException(status_code=404, detail="Document type not found")
    return {
        "document_type": key,
        "required_inputs": _get_suggested_inputs(key),
        "optional": ["notes", "special_terms"],
        "output_format": ["markdown", "html", "text"],
        "include_sources": True
    }


@app.post("/template-preview")
async def template_preview(document_type: str):
    """
    Returns a stubbed skeleton (headings only) for the given document type in Markdown
    to help the frontend show a preview of structure before actual generation.
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")
    key = document_type.lower().replace(" ", "_")
    if key not in generator.checklists:
        raise HTTPException(status_code=404, detail="Document type not found")
    data = generator.checklists[key]
    title = data.get("display_name", key.replace("_", " ").title())
    headings = [
        f"# {title}",
        "## Parties",
        "## Recitals",
        "## Definitions",
        "## Main Clauses",
        "## Term and Termination",
        "## Representations and Warranties",
        "## Indemnity and Limitation of Liability",
        "## Confidentiality / IP",
        "## Compliance with Laws",
        "## Notices",
        "## Governing Law and Jurisdiction (India)",
        "## Dispute Resolution",
        "## Miscellaneous",
        "## Execution / Signatures"
    ]
    return {"skeleton_markdown": "\n\n".join(headings)}


# ============================================================================
# Helper Functions
# ============================================================================

def _get_suggested_inputs(document_type: str) -> List[str]:
    """Get suggested input fields for a document type"""

    # Common inputs for all documents
    common_inputs = ["effective_date", "jurisdiction_city"]

    # Document-specific inputs
    specific_inputs = {
        "nda": [
            "party_a", "party_a_address", "party_b", "party_b_address",
            "purpose", "term", "confidentiality_period"
        ],
        "offer_letter": [
            "company_name", "company_address", "employee_name", "employee_address",
            "position", "salary", "joining_date", "probation_period", "notice_period"
        ],
        "non_compete_agreement": [
            "company_name", "employee_name", "restriction_period",
            "geographic_scope", "restricted_activities", "consideration"
        ],
        "partnership_deed": [
            "firm_name", "partner_names", "business_nature",
            "capital_contribution", "profit_sharing_ratio", "business_address"
        ],
        "mou": [
            "party_a", "party_b", "purpose", "term",
            "key_obligations", "binding_clauses"
        ],
        "vendor_agreement": [
            "company_name", "vendor_name", "services_description",
            "payment_terms", "service_levels", "term"
        ],
        "loan_agreement": [
            "lender_name", "borrower_name", "loan_amount",
            "interest_rate", "repayment_schedule", "security"
        ],
        "employment_contract": [
            "company_name", "employee_name", "position", "salary",
            "benefits", "working_hours", "leave_policy", "notice_period"
        ],
        "shareholder_agreement": [
            "company_name", "shareholders", "shareholding_percentage",
            "voting_rights", "dividend_policy", "transfer_restrictions"
        ],
        "sale_deed": [
            "seller_name", "buyer_name", "property_description",
            "sale_price", "payment_terms", "possession_date"
        ]
    }

    return common_inputs + specific_inputs.get(document_type, [
        "party_a", "party_b", "key_terms"
    ])


# ============================================================================
# Server Startup
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    print("\n" + "="*80)
    print("JurisDraft Document Generation API Server")
    print("="*80)
    print("Endpoints:")
    print("  POST /generate - Generate legal documents")
    print("  GET  /document-types - List available document types")
    print("  GET  /document-types/{type} - Get document type details")
    print("  POST /preview-checklist - Preview checklist for document type")
    print("  GET  /document-types/schema/{type} - Get document type input schema")
    print("  POST /template-preview - Get document template preview (headings)")
    print("="*80 + "\n")

    uvicorn.run(
        "api_document_generation:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
