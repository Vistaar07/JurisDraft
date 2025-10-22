# app/main.py
import uvicorn
from fastapi import FastAPI
from app.models import QueryRequest  # <-- Import from models.py
from app.rag_config import rag_chain # <-- Import the chain
# from app.logic.checklist_factory import ... (Import your logic here)

app = FastAPI(
    title="Legal AI Analyst API",
    version="2.0.0",
)

@app.post("/api/v1/analyze")
def analyze_query(request: QueryRequest):
    """
    Accepts a legal query and returns a detailed analysis from the RAG pipeline.
    """
    print(f"Received query for analysis: {request.query}")
    result = rag_chain.invoke(request.query)
    return {"query": request.query, "analysis": result}

@app.get("/")
def read_root():
    return {"status": "Legal AI Analyst API is running"}

if __name__ == "__main__":
    # Note: You run this from the 'Backend/' directory
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)