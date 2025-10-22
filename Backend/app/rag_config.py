import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain.retrievers import EnsembleRetriever

# --- 1. Load Models ---
print("Loading embedding model...")
model_name = "sentence-transformers/all-MiniLM-L6-v2"
model_kwargs = {'device': 'cpu'}
embeddings = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs)

print("Loading LLM...")
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    google_api_key=os.environ.get("GOOGLE_API_KEY"),
    temperature=0.4,
    convert_system_message_to_human=True
)

# --- 2. Load Vector Stores ---
# Note: Paths are now from the root of 'Backend/'
print("Loading FAISS_ACTS index...")
FAISS_ACTS_PATH = "faiss_acts"
db_acts = FAISS.load_local(FAISS_ACTS_PATH, embeddings, allow_dangerous_deserialization=True)
retriever_acts = db_acts.as_retriever(search_kwargs={'k': 3})

print("Loading FAISS_JUDGMENTS index...")
FAISS_JUDGMENTS_PATH = "faiss_judgements"
db_judgments = FAISS.load_local(FAISS_JUDGMENTS_PATH, embeddings, allow_dangerous_deserialization=True)
retriever_judgments = db_judgments.as_retriever(search_kwargs={'k': 5})

# --- 3. Create Ensemble Retriever ---
print("Initializing Ensemble Retriever...")
ensemble_retriever = EnsembleRetriever(
    retrievers=[retriever_acts, retriever_judgments],
    weights=[0.4, 0.6]
)

# --- 4. Create Prompt for loophole analysis ---
analysis_template = """
You are an expert Indian Legal Risk Analyst. Your task is to analyze a question or legal document based ONLY on the provided context.

The CONTEXT provided is a mix of two sources:
1.  **Legal Acts:** These are the black-letter laws, definitions, and statutes.
2.  **Court Judgments:** These are real-world examples of how the Legal Acts have been interpreted, disputed, and litigated in the Supreme Court.

Based ONLY on the combined context above, provide a detailed analysis for the following question.

**If the question asks for loopholes, risks, or ambiguities:**
1.  First, use the **Legal Acts** context to state the letter of the law.
2.  Then, use the **Court Judgments** context as precedent to identify common points of failure, ambiguities, or areas that are frequently challenged in court.
3.  Conclude with a risk analysis or list of potential loopholes, explaining *why* they are risks by referencing the judgment context.

If the context is insufficient, state that you cannot provide a definitive analysis.

CONTEXT:
{context}

QUESTION:
{question}

DETAILED RISK & LOOPHOLE ANALYSIS:
"""
prompt = PromptTemplate.from_template(analysis_template)

# --- 5. Build RAG Chain ---
print("Building RAG chain...")
rag_chain = (
        {"context": ensemble_retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
)

print("RAG chain ready.")