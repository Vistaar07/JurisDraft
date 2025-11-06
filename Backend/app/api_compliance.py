"""
API for Legal Document Compliance Checking and Loophole Detection (India)
File: api_compliance.py

Endpoints:
  - GET  /health
  - POST /check-compliance/text
  - POST /check-compliance/file (PDF/DOCX/TXT)

Backed by:
  - rag_config.RAGConfig (FAISS + embeddings + Gemini 2.5 Pro)
  - rag_config.ComplianceChecker

Notes:
  - Only Indian legal domain is supported via checklist-driven analysis.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import tempfile

try:
    import pypdf
    _HAS_PYPDF = True
except Exception:
    pypdf = None
    _HAS_PYPDF = False

from docx import Document as DocxDocument

from .rag_config import create_compliance_checker

app = FastAPI(
    title="JurisDraft Compliance API",
    description="Compliance checking and loophole detection for Indian legal documents",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_checker = None
try:
    _checker = create_compliance_checker()
    print("✓ ComplianceChecker initialized")
except Exception as e:
    print(f"⚠️ Failed to initialize ComplianceChecker: {e}")


def _extract_text_from_pdf(file_path: str) -> str:
    if not _HAS_PYPDF:
        raise HTTPException(status_code=500, detail="PDF parsing dependency 'pypdf' not installed")
    text = ""
    with open(file_path, 'rb') as f:
        reader = pypdf.PdfReader(f)  # type: ignore[attr-defined]
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"
    return text


def _extract_text_from_docx(file_path: str) -> str:
    doc = DocxDocument(file_path)
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_text(file_path: str, filename: str) -> str:
    ext = filename.lower().split('.')[-1]
    if ext == 'pdf':
        return _extract_text_from_pdf(file_path)
    if ext in ['docx', 'doc']:
        return _extract_text_from_docx(file_path)
    if ext == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")


@app.get("/health")
def health():
    return {
        "status": "healthy" if _checker else "degraded",
        "vectorstore_acts": bool(_checker and _checker.vectorstore_acts),
        "checklists_loaded": len(_checker.checklists) if _checker else 0,
        "model": "gemini-2.5-pro",
        "embedding_model": "mixedbread-ai/mxbai-embed-large-v1"
    }


@app.post("/check-compliance/text")
def check_compliance_text(document_text: str, document_type: str, jurisdiction: str = "India"):
    if not _checker:
        raise HTTPException(status_code=503, detail="Compliance checker not initialized")
    if not document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty")
    result = _checker.check_document(document_text, document_type, jurisdiction)
    return {
        "success": True,
        "document_type": result.document_type,
        "compliance_checks": [c.model_dump() for c in result.compliance_checks],
        "loopholes": [l.model_dump() for l in result.loopholes],
        "overall_risk_score": result.overall_risk_score,
        "risk_level": result.risk_level,
        "summary": result.summary,
        "recommendations": result.recommendations
    }


@app.post("/check-compliance/file")
async def check_compliance_file(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    jurisdiction: str = Form("India")
):
    if not _checker:
        raise HTTPException(status_code=503, detail="Compliance checker not initialized")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    temp = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp:
            content = await file.read()
            temp.write(content)
            temp_path = temp.name
        text = _extract_text(temp_path, file.filename)
        result = _checker.check_document(text, document_type, jurisdiction)
        return {
            "success": True,
            "document_type": result.document_type,
            "compliance_checks": [c.model_dump() for c in result.compliance_checks],
            "loopholes": [l.model_dump() for l in result.loopholes],
            "overall_risk_score": result.overall_risk_score,
            "risk_level": result.risk_level,
            "summary": result.summary,
            "recommendations": result.recommendations
        }
    finally:
        if temp:
            try:
                Path(temp_path).unlink(missing_ok=True)
            except Exception:
                pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_compliance:app", host="0.0.0.0", port=8001, reload=True)
