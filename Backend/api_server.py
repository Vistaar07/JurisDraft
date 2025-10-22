import uvicorn
import os
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# Initialize FastAPI App
app = FastAPI(
    title="Legal AI Analyst API",
    description="Query a knowledge base of Indian legal acts and case law.",
    version="2.0.0",
)

# --- Load Models and Vector Store ONCE at Startup ---
print("Loading models and comprehensive vector store...")

# Load the local embedding model (must be the same one used to create the index)
model_name = "sentence-transformers/all-MiniLM-L6-v2"
model_kwargs = {'device': 'cpu'}
embeddings = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs)

# Load the FAISS index from the local directory
FAISS_INDEX_PATH = "faiss_index"
db = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
retriever = db.as_retriever(search_kwargs={'k': 7}) # Retrieve 7 relevant chunks for more context

# Initialize the Gemini Pro LLM for generation
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    google_api_key=os.environ.get("GOOGLE_API_KEY"),
    temperature=0.4, # Slightly higher temperature for more nuanced analysis
    convert_system_message_to_human=True
)

print("Models and vector store loaded successfully.")

# --- Define the "Legal Analyst" Prompt Template ---
analysis_template = """
You are an expert Indian Legal AI Analyst. Your task is to provide a detailed analysis based ONLY on the provided context, which includes both legal acts and relevant court judgments.

Do not use any external knowledge. If the context is insufficient, state that you cannot provide a definitive analysis based on the provided information.

CONTEXT:
{context}

Based on the context above, provide a detailed answer to the following question. If the question asks for loopholes or ambiguities, analyze the text for undefined terms, conflicting clauses, or situations not explicitly covered by the law.

QUESTION:
{question}

DETAILED ANALYSIS:
"""
prompt = PromptTemplate.from_template(analysis_template)

# --- Define the Request Body Model ---
class QueryRequest(BaseModel):
    query: str

# --- Build the RAG Chain ---
rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# --- Create the API Endpoint ---
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
    uvicorn.run(app, host="0.0.0.0", port=8000)