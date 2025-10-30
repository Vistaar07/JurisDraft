import json
import math
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple, Set

import numpy as np
from rapidfuzz import fuzz, process
from rouge_score import rouge_scorer

# Optional: pandas is used by the runner for saving tables

# --------------------
# Text normalization + core QA metrics (SQuAD-style)
# --------------------
import re
import string
from collections import Counter

ARTICLES = {"a", "an", "the"}

def normalize_answer(s: str) -> str:
    if s is None:
        return ""
    def lower(text):
        return text.lower()
    def remove_articles(text):
        return re.sub(r"\b(a|an|the)\b", " ", text)
    def remove_punc(text):
        return text.translate(str.maketrans('', '', string.punctuation))
    def white_space_fix(text):
        return " ".join(text.split())
    return white_space_fix(remove_articles(remove_punc(lower(s))))

def em_score(pred: str, gold: str) -> float:
    return 1.0 if normalize_answer(pred) == normalize_answer(gold) else 0.0

def f1_score_squad(pred: str, gold: str) -> float:
    pred_tokens = normalize_answer(pred).split()
    gold_tokens = normalize_answer(gold).split()
    common = Counter(pred_tokens) & Counter(gold_tokens)
    num_same = sum(common.values())
    if len(pred_tokens) == 0 or len(gold_tokens) == 0:
        return float(pred_tokens == gold_tokens)
    if num_same == 0:
        return 0.0
    precision = 1.0 * num_same / len(pred_tokens)
    recall = 1.0 * num_same / len(gold_tokens)
    return (2 * precision * recall) / (precision + recall)

_rouge = rouge_scorer.RougeScorer(['rouge1','rouge2','rougeLsum'], use_stemmer=True)

def rouge_scores(pred: str, gold: str) -> Dict[str, float]:
    r = _rouge.score(gold or "", pred or "")
    return {
        "rouge1": r['rouge1'].fmeasure,
        "rouge2": r['rouge2'].fmeasure,
        "rougeL": r['rougeLsum'].fmeasure,
    }

# --------------------
# Dataset loader
# --------------------

def load_indiclegalqa(path: str) -> List[Dict[str, Any]]:
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    samples = []
    for i, ex in enumerate(data):
        samples.append({
            "id": str(i),
            "case_name": ex.get("case_name", "").strip(),
            "judgement_date": ex.get("judgement_date", "").strip(),
            "question": ex.get("question", "").strip(),
            "answer": ex.get("answer", "").strip(),
        })
    return samples

# --------------------
# Fuzzy mapping: case_name -> relevant corpus sources
# --------------------

def build_source_catalog_from_faiss(faiss_dir: str) -> List[str]:
    """Extract unique identifiers (metadata['source'] and 'doc_id' if present) from a LangChain FAISS store directory.

    Tries, in order:
    1) index.pkl (since this is what the user has)
    2) docstore.json (fast, preferred)
    3) docstore.pkl (pickle fallback)

    We avoid loading the FAISS embeddings/index for speed and memory safety.
    """
    dir_path = Path(faiss_dir).resolve()
    id_strings: list[str] = []

    # 1) index.pkl fallback (older LangChain versions put docstore inside index.pkl)
    index_pkl = dir_path / "index.pkl"
    if index_pkl.exists():
        try:
            import pickle
            with open(index_pkl, "rb") as f:
                obj = pickle.load(f)
            # Heuristics: obj may be a dict with keys like 'docstore' or have attribute 'docstore'.
            store = None
            # Variant A: dict with 'docstore'
            if isinstance(obj, dict):
                ds = obj.get("docstore") or obj.get("_docstore")
            else:
                ds = getattr(obj, "docstore", None) or getattr(obj, "_docstore", None)
            # Extract internal store dict
            if ds is not None:
                try:
                    store = getattr(ds, "_dict", {}).get("store", {})
                except Exception:
                    # Maybe ds itself is dict-like
                    try:
                        store = ds.get("_dict", {}).get("store", {}) if isinstance(ds, dict) else None
                    except Exception:
                        store = None
            if isinstance(store, dict):
                for _, item in store.items():
                    md = (item.get("metadata", {}) if isinstance(item, dict) else 
                          (getattr(item, "metadata", None) or {}))
                    src = (md.get("source") if isinstance(md, dict) else None) or (md.get("title") if isinstance(md, dict) else None)
                    doc_id = md.get("doc_id") if isinstance(md, dict) else None
                    if src:
                        id_strings.append(str(src))
                    if doc_id:
                        id_strings.append(str(doc_id))
                if id_strings:
                    return sorted(set(id_strings))
        except Exception:
            pass

    # 2) JSON docstore
    docstore_json = dir_path / "docstore.json"
    if docstore_json.exists():
        try:
            obj = json.loads(docstore_json.read_text(encoding='utf-8'))
            store = obj.get("_dict", {}).get("store", {})
            for _, item in store.items():
                md = item.get("metadata", {}) or {}
                src = md.get("source") or md.get("title")
                doc_id = md.get("doc_id")
                if src:
                    id_strings.append(str(src))
                if doc_id:
                    id_strings.append(str(doc_id))
            return sorted(set(id_strings))
        except Exception:
            pass

    # 3) Pickle docstore (fallback)
    docstore_pkl = dir_path / "docstore.pkl"
    if docstore_pkl.exists():
        try:
            import pickle
            with open(docstore_pkl, "rb") as f:
                obj = pickle.load(f)
            # Expected to be a InMemoryDocstore or similar with _dict or _dict["store"]
            store = None
            if isinstance(obj, dict):
                store = obj.get("_dict", {}).get("store", {})
            else:
                # Try attributes
                try:
                    store = getattr(obj, "_dict", {}).get("store", {})
                except Exception:
                    store = None
            if isinstance(store, dict):
                for _, item in store.items():
                    md = (item.get("metadata", {}) if isinstance(item, dict) else 
                          (getattr(item, "metadata", None) or {}))
                    src = (md.get("source") if isinstance(md, dict) else None) or (md.get("title") if isinstance(md, dict) else None)
                    doc_id = md.get("doc_id") if isinstance(md, dict) else None
                    if src:
                        id_strings.append(str(src))
                    if doc_id:
                        id_strings.append(str(doc_id))
                return sorted(set(id_strings))
        except Exception:
            pass

    return []


def _normalize_title_for_match(s: str) -> str:
    if not s:
        return ""
    s = str(s)
    s = s.lower()
    # Keep filename stem if looks like a path
    try:
        s_path = Path(s)
        stem = s_path.stem
        if stem:
            s = stem
    except Exception:
        pass
    # Remove common legal stopwords and punctuation
    s = re.sub(r"[\-_]+", " ", s)
    s = re.sub(r"[^\w\s]", " ", s)
    # Collapse whitespace
    s = " ".join(s.split())
    # Remove very common tokens that hurt matching
    stop = {"vs", "v", "and", "the", "of", "&", "vs.", "v.", "state", "union", "or"}
    tokens = [t for t in s.split() if t not in stop]
    return " ".join(tokens)


def match_relevant_sources(case_name: str, catalog: List[str], threshold: int = 80) -> Set[str]:
    """Return a set of catalog entries whose normalized form is similar to case_name.

    We try in order:
    - Exact substring on raw
    - Exact equality on normalized
    - Fuzzy token_set_ratio on normalized strings
    """
    if not case_name or not catalog:
        return set()

    # Exact substring matches on raw strings
    cn_raw = case_name.strip()
    exact_raw = [s for s in catalog if cn_raw.lower() in str(s).lower()]
    if exact_raw:
        return set(exact_raw)

    # Build normalized lists
    cn_norm = _normalize_title_for_match(case_name)
    norm_catalog = [(s, _normalize_title_for_match(s)) for s in catalog]

    # Exact equality on normalized
    exact_norm = [raw for (raw, norm) in norm_catalog if norm and norm == cn_norm and raw]
    if exact_norm:
        return set(exact_norm)

    # Fuzzy match on normalized values
    cat_norm_values = [norm for (_, norm) in norm_catalog]
    matches = process.extract(cn_norm, cat_norm_values, scorer=fuzz.token_set_ratio, limit=10)
    out = set()
    for m_norm, score, idx in matches:
        if score >= threshold and 0 <= idx < len(norm_catalog):
            out.add(norm_catalog[idx][0])  # raw catalog string
    return out

# --------------------
# Retrieval metrics
# --------------------

def is_hit(retrieved_items: List[Dict[str, Any]], relevant_sources: Set[str]) -> float:
    return 1.0 if any((it.get("metadata", {}).get("source") in relevant_sources) for it in retrieved_items) else 0.0


def first_relevant_rank(retrieved_items: List[Dict[str, Any]], relevant_sources: Set[str]):
    for i, it in enumerate(retrieved_items, start=1):
        if it.get("metadata", {}).get("source") in relevant_sources:
            return i
    return math.inf


def ndcg_at_k(retrieved_items: List[Dict[str, Any]], relevant_sources: Set[str], k: int) -> float:
    dcg = 0.0
    for i, it in enumerate(retrieved_items[:k], start=1):
        rel = 1.0 if it.get("metadata", {}).get("source") in relevant_sources else 0.0
        if rel > 0:
            dcg += 1.0 / math.log2(i + 1)
    idcg = 1.0  # at least one relevant ideally at rank 1
    return dcg / idcg if dcg > 0 else 0.0


def oracle_answerable(retrieved_items: List[Dict[str, Any]], gold_answer: str) -> float:
    ans_norm = normalize_answer(gold_answer)
    for it in retrieved_items:
        text = normalize_answer(it.get("text", ""))
        if ans_norm and ans_norm in text:
            return 1.0
    return 0.0

# --------------------
# Simple retriever wrappers over LangChain FAISS
# --------------------
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
import torch

class FaissRetriever:
    def __init__(self, faiss_dir: str, embed_model: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.faiss_dir = os.path.abspath(faiss_dir)
        self.embed_model = embed_model
        use_cuda = torch.cuda.is_available()
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embed_model,
            model_kwargs={"device": "cuda" if use_cuda else "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        # allow_dangerous_deserialization required for older index formats
        self.db = FAISS.load_local(self.faiss_dir, self.embeddings, allow_dangerous_deserialization=True)
        self.name = Path(self.faiss_dir).name

    def retrieve(self, query: str, k: int) -> List[Dict[str, Any]]:
        docs = self.db.similarity_search_with_score(query, k=k)
        items = []
        for d, score in docs:
            items.append({
                "text": d.page_content,
                "score": float(score),
                "metadata": dict(d.metadata or {}),
            })
        return items

# --------------------
# LLM integration (Gemini) and prompt helpers (optional)
# --------------------

CITATION_PROMPT = (
    "You are a legal assistant. Answer concisely using only the provided passages. "
    "Cite supporting passages with indices like [1], [2]. If unsure, say you cannot answer.\n\n"
    "Question: {question}\n\nPassages:\n{passages}\n\n"
    "Format: <answer in 1-3 sentences> [citations]"
)

def build_passage_block(items: List[Dict[str, Any]], per_snippet_chars: int = 800, total_chars: int = 15000) -> str:
    """Format retrieved items into a passages block with conservative truncation.
    Truncates each snippet and caps total characters to keep prompts within model context.
    """
    lines = []
    used = 0
    for idx, it in enumerate(items, start=1):
        src = (it.get("metadata", {}) or {}).get("source", "")
        snippet = (it.get("text", "") or "").strip()
        if per_snippet_chars > 0 and len(snippet) > per_snippet_chars:
            snippet = snippet[:per_snippet_chars] + "…"
        block = f"[{idx}] {snippet}\n(Source: {src})\n\n"
        if total_chars > 0 and used + len(block) > total_chars:
            break
        lines.append(block)
        used += len(block)
    return "".join(lines).strip()

# Lazy import to avoid requiring google-generativeai unless used
try:
    import google.generativeai as genai  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    genai = None  # type: ignore


def gemini_generate(prompt: str, api_key: str | None = None, model_name: str = "gemini-1.5-pro", max_output_tokens: int = 512) -> str:
    """Call Gemini to generate text. Returns empty string on failure.
    The API key is taken from the parameter or GOOGLE_API_KEY env var.
    """
    try:
        key = api_key or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if genai is None or not key:
            return ""
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(prompt, generation_config={"max_output_tokens": max_output_tokens})
        # SDK returns .text on success
        text = getattr(resp, "text", None)
        if isinstance(text, str):
            return text.strip()
        # Fallback: concatenate candidates
        try:
            parts = []
            for cand in getattr(resp, "candidates", []) or []:
                cont = getattr(cand, "content", None)
                if cont and getattr(cont, "parts", None):
                    for p in cont.parts:
                        val = getattr(p, "text", None)
                        if val:
                            parts.append(val)
            return "\n".join(parts).strip()
        except Exception:
            return ""
    except Exception:
        return ""

# --------------------
# Utility
# --------------------

def ensure_dir(p: str | Path):
    Path(p).mkdir(parents=True, exist_ok=True)


def save_json(path: str | Path, obj: Any):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')
