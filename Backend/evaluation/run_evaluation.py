import argparse
import json
import os
from pathlib import Path
from statistics import mean
from typing import Dict, Any, List, Set

import pandas as pd
import google.generativeai as genai
from tqdm import tqdm

from eval_utils import (
    load_indiclegalqa,
    FaissRetriever,
    build_source_catalog_from_faiss,
    match_relevant_sources,
    em_score,
    f1_score_squad,
    rouge_scores,
    is_hit,
    first_relevant_rank,
    ndcg_at_k,
    oracle_answerable,
    ensure_dir,
    save_json,
    normalize_answer,
    CITATION_PROMPT,
    build_passage_block,
    gemini_generate,
)

# ----------------------------
# Simple retrieval-only QA heuristic
# ----------------------------

def best_sentence_from_text(text: str, question: str) -> str:
    """Pick the sentence with the highest token overlap with question.
    This is a simple, non-LLM baseline for capstone evaluation.
    """
    if not text:
        return ""
    # Split on periods and newlines
    sentences = []
    for seg in text.split("\n"):
        sentences.extend([s.strip() for s in seg.split(".") if s.strip()])
    if not sentences:
        return text.strip()[:300]

    q_tokens = set(normalize_answer(question).split())
    if not q_tokens:
        return sentences[0][:300]

    best_s = sentences[0]
    best_score = -1
    for s in sentences:
        s_tokens = set(normalize_answer(s).split())
        overlap = len(q_tokens & s_tokens)
        if overlap > best_score:
            best_score = overlap
            best_s = s
    return best_s[:600]


def pick_answer_from_retrieval(retrieved_items: List[Dict[str, Any]], question: str) -> str:
    """Return the best sentence from the top-1 chunk as the answer candidate."""
    if not retrieved_items:
        return ""
    top = retrieved_items[0]
    return best_sentence_from_text(top.get("text", ""), question)


# ----------------------------
# HyDE: Hypothetical Document Embeddings
# ----------------------------

def generate_hypothetical_answer(question: str, model_name: str) -> str:
    """Generates a hypothetical answer using a Gemini model for HyDE."""
    try:
        model = genai.GenerativeModel(model_name)
        prompt = f"Please write a short, hypothetical answer to the following legal question. This will be used for a vector search, so focus on relevant legal concepts and terminology.\n\nQuestion: {question}\n\nHypothetical Answer:"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Warning: HyDE generation failed for question '{question[:50]}...'. Error: {e}. Falling back to original question.")
        return question # Fallback to original question


# ----------------------------
# Helper: discover FAISS directories
# ----------------------------

def find_faiss_dir(candidates: List[Path]) -> Path | None:
    for p in candidates:
        if (p / "index.faiss").exists() or (p / "index.pkl").exists():
            return p
    return None


# ----------------------------
# Main evaluation runner
# ----------------------------

def main():
    parser = argparse.ArgumentParser(description="Evaluate RAG retrieval baseline on IndicLegalQA")
    parser.add_argument("--dataset", type=str, default=str(Path(__file__).parents[0] / "IndicLegalQA Dataset_10K_Revised.json"))
    parser.add_argument("--faiss_a", type=str, default="")
    parser.add_argument("--faiss_b", type=str, default="")
    parser.add_argument("--k", type=int, nargs="+", default=[5, 10, 20])
    parser.add_argument("--outdir", type=str, default=str(Path(__file__).parents[0] / "results"))
    # Retrieval/embeddings options
    parser.add_argument("--embed_model", type=str, default="sentence-transformers/all-MiniLM-L6-v2", help="Embedding model to use for queries (must match index build model)")
    parser.add_argument("--e5_instructions", action="store_true", help="Prefix queries with 'query: ' (for E5-style models)")
    # Debugging options
    parser.add_argument("--debug", action="store_true", help="Dump diagnostic retrieval/matching info for a sample of queries")
    parser.add_argument("--debug_n", type=int, default=25, help="Number of samples to include in debug dump")
    # Optional LLM evaluation via Gemini
    parser.add_argument("--use_llm", action="store_true", help="Enable LLM evaluation using Gemini with retrieved passages")
    parser.add_argument("--use_hyde", action="store_true", help="Enable query transformation using Hypothetical Document Embeddings (HyDE) with Gemini")
    parser.add_argument("--gemini_key", type=str, default="", help="Gemini API key (optional). If empty, uses env GOOGLE_API_KEY or GEMINI_API_KEY")
    parser.add_argument("--model_name", type=str, default="gemini-2.5-pro", help="Gemini model name (e.g., gemini-1.5-flash, gemini-1.5-pro)")
    parser.add_argument("--max_output_tokens", type=int, default=512)
    parser.add_argument("--max_passages", type=int, default=10, help="Max passages to include in the prompt (from both stores combined)")
    args = parser.parse_args()

    # Configure Gemini API key if HyDE or LLM eval is used
    if args.use_llm or args.use_hyde:
        api_key = args.gemini_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("Gemini API key not found. Please provide it via --gemini_key or set GEMINI_API_KEY/GOOGLE_API_KEY environment variable.")
        genai.configure(api_key=api_key)

    dataset_path = Path(args.dataset)

    # Resolve FAISS directories
    if args.faiss_a:
        faiss_a = Path(args.faiss_a)
    else:
        # Try common locations
        cand_a = [
            Path(__file__).parents[1] / "scripts" / "faiss_acts",
            Path(__file__).parents[1] / "faiss_acts",
            ]
        faiss_a = find_faiss_dir(cand_a)
        if faiss_a is None:
            raise FileNotFoundError("Could not find FAISS store A (acts). Pass --faiss_a path.")

    if args.faiss_b:
        faiss_b = Path(args.faiss_b)
    else:
        cand_b = [
            Path(__file__).parents[1] / "scripts" / "faiss_judgments",
            Path(__file__).parents[1] / "faiss_judgments",
            ]
        faiss_b = find_faiss_dir(cand_b)
        if faiss_b is None:
            raise FileNotFoundError("Could not find FAISS store B (judgments). Pass --faiss_b path.")

    outdir = Path(args.outdir)
    ensure_dir(outdir)

    print(f"Loading dataset from: {dataset_path}")
    samples = load_indiclegalqa(str(dataset_path))

    # Build relevance catalogs from both stores
    print("Building source catalogs from FAISS stores (no embeddings loaded) ...")
    cat_a = build_source_catalog_from_faiss(str(faiss_a))
    cat_b = build_source_catalog_from_faiss(str(faiss_b))
    combined_catalog = sorted(set(cat_a) | set(cat_b))
    print(f"Catalog sizes: A={len(cat_a)}, B={len(cat_b)}, union={len(combined_catalog)}")

    # Map each sample to relevant sources by case_name
    for s in samples:
        s["relevant_sources"] = list(match_relevant_sources(s["case_name"], combined_catalog, threshold=80))

    # Basic coverage stats for relevance mapping
    non_empty = sum(1 for s in samples if s.get("relevant_sources"))
    coverage = non_empty / max(1, len(samples))
    print(f"Relevant-source mapping coverage: {non_empty}/{len(samples)} = {coverage:.2%}")
    save_json(outdir / "relevance_mapping_stats.json", {
        "total": len(samples),
        "non_empty": non_empty,
        "coverage": coverage,
        "catalog_sizes": {"acts": len(cat_a), "judgments": len(cat_b), "union": len(combined_catalog)},
    })

    # Initialize retrievers (embeddings will be loaded once per retriever)
    print(f"Loading FAISS retriever A from: {faiss_a}")
    retrieverA = FaissRetriever(str(faiss_a), embed_model=args.embed_model)
    print(f"Loading FAISS retriever B from: {faiss_b}")
    retrieverB = FaissRetriever(str(faiss_b), embed_model=args.embed_model)

    # Optional debug: dump first N samples with retrieved lists and overlaps
    if args.debug:
        dbg_path = outdir / "debug_overview.jsonl"
        print(f"Debug enabled: writing per-sample retrieval diagnostics to {dbg_path}")
        with open(dbg_path, "w", encoding="utf-8") as fdbg:
            for ex in samples[: max(1, args.debug_n)]:
                qtext = ex["question"]
                if args.use_hyde:
                    qtext = generate_hypothetical_answer(ex["question"], args.model_name)
                if args.e5_instructions:
                    qtext = "query: " + qtext
                topk = 10
                ret_a = retrieverA.retrieve(qtext, k=topk)
                ret_b = retrieverB.retrieve(qtext, k=topk)
                rel = set(ex.get("relevant_sources", []))
                def just_sources(items):
                    return [it.get("metadata", {}).get("source") for it in items]
                a_src = just_sources(ret_a)
                b_src = just_sources(ret_b)
                inter_a = list(rel.intersection(set(a_src)))
                inter_b = list(rel.intersection(set(b_src)))
                rec = {
                    "id": ex["id"],
                    "case_name": ex["case_name"],
                    "relevant_sources": list(rel),
                    "a_top_sources": a_src,
                    "b_top_sources": b_src,
                    "a_intersection": inter_a,
                    "b_intersection": inter_b,
                }
                fdbg.write(json.dumps(rec, ensure_ascii=False) + "\n")

    def evaluate_store(store_name: str, retriever: FaissRetriever, k_list: List[int]):
        all_results = {}
        for k in k_list:
            records = []
            desc = f"{store_name} k={k}"
            if args.use_hyde:
                desc += " (HyDE)"
            for ex in tqdm(samples, desc=desc):
                qid = ex["id"]; question = ex["question"]; gold = ex["answer"]
                relevant_sources: Set[str] = set(ex.get("relevant_sources", []))

                # Determine query text: original question or hypothetical answer
                query_text = question
                if args.use_hyde:
                    query_text = generate_hypothetical_answer(question, args.model_name)
                if args.e5_instructions:
                    query_text = "query: " + query_text

                retrieved = retriever.retrieve(query_text, k=k)
                pred = pick_answer_from_retrieval(retrieved, question)

                # Metrics
                em = em_score(pred, gold)
                f1 = f1_score_squad(pred, gold)
                r = rouge_scores(pred, gold)

                hit = is_hit(retrieved, relevant_sources)
                rank = first_relevant_rank(retrieved, relevant_sources)
                mrr = 0.0 if rank == float('inf') else 1.0 / rank
                ndcg = ndcg_at_k(retrieved, relevant_sources, k)
                oracle = oracle_answerable(retrieved, gold)

                records.append({
                    "id": qid,
                    "case_name": ex["case_name"],
                    "em": em,
                    "f1": f1,
                    "rouge1": r["rouge1"],
                    "rouge2": r["rouge2"],
                    "rougeL": r["rougeL"],
                    "hit@k": hit,
                    "mrr": mrr,
                    "ndcg": ndcg,
                    "oracle@k": oracle,
                    "pred": pred,
                    "gold": gold,
                    "question": question,
                    "relevant_sources": list(relevant_sources),
                    "retrieved": [
                        {
                            "source": it.get("metadata", {}).get("source"),
                            "score": it.get("score"),
                            "text": it.get("text"),
                        } for it in retrieved
                    ],
                })

            # Aggregate
            agg = {
                "N": len(records),
                "EM": mean(r["em"] for r in records) if records else 0.0,
                "F1": mean(r["f1"] for r in records) if records else 0.0,
                "ROUGE1": mean(r["rouge1"] for r in records) if records else 0.0,
                "ROUGE2": mean(r["rouge2"] for r in records) if records else 0.0,
                "ROUGEL": mean(r["rougeL"] for r in records) if records else 0.0,
                "Hit@k": mean(r["hit@k"] for r in records) if records else 0.0,
                "MRR": mean(r["mrr"] for r in records) if records else 0.0,
                "nDCG": mean(r["ndcg"] for r in records) if records else 0.0,
                "Oracle@k": mean(r["oracle@k"] for r in records) if records else 0.0,
            }

            all_results[k] = {"aggregate": agg, "records": records}

            # Save
            run_name = f"{store_name}_k{k}"
            if args.use_hyde:
                run_name += "_hyde"
            run_dir = outdir / run_name
            ensure_dir(run_dir)
            save_json(run_dir / "aggregate.json", agg)
            # Also save CSV of per-record metrics
            df = pd.DataFrame(records)
            df.to_csv(run_dir / "per_record.csv", index=False)
            # Save full records with retrieved contexts as JSONL
            with open(run_dir / "records.jsonl", "w", encoding="utf-8") as f:
                for r in records:
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")
        return all_results

    results_a = evaluate_store("StoreA_Acts", retrieverA, args.k)
    results_b = evaluate_store("StoreB_Judgments", retrieverB, args.k)

    # Optional: LLM evaluation combining both stores' passages
    llm_results = {}
    if args.use_llm:
        def evaluate_llm_combined(k_list: List[int]):
            all_results = {}
            for k in k_list:
                records = []
                desc = f"LLM Gemini {args.model_name} k={k}"
                if args.use_hyde:
                    desc += " (HyDE)"
                for ex in tqdm(samples, desc=desc):
                    qid = ex["id"]; question = ex["question"]; gold = ex["answer"]
                    relevant_sources: Set[str] = set(ex.get("relevant_sources", []))

                    # Determine query text: original question or hypothetical answer
                    query_text = question
                    if args.use_hyde:
                        query_text = generate_hypothetical_answer(question, args.model_name)

                    # Retrieve from both stores; take top-k from each then cap to max_passages
                    ret_a = retrieverA.retrieve(query_text, k=k)
                    ret_b = retrieverB.retrieve(query_text, k=k)
                    combined = ret_a + ret_b
                    combined = combined[: args.max_passages] if len(combined) > args.max_passages else combined

                    passages_block = build_passage_block(combined)
                    prompt = CITATION_PROMPT.format(question=question, passages=passages_block)
                    pred = gemini_generate(prompt, api_key=args.gemini_key or None, model_name=args.model_name, max_output_tokens=args.max_output_tokens)
                    if not pred:
                        # Fallback to heuristic if LLM call fails
                        pred = pick_answer_from_retrieval(combined, question)

                    # Metrics
                    em = em_score(pred, gold)
                    f1 = f1_score_squad(pred, gold)
                    r = rouge_scores(pred, gold)

                    hit = is_hit(combined, relevant_sources)
                    rank = first_relevant_rank(combined, relevant_sources)
                    mrr = 0.0 if rank == float('inf') else 1.0 / rank
                    ndcg = ndcg_at_k(combined, relevant_sources, min(k, args.max_passages))
                    oracle = oracle_answerable(combined, gold)

                    records.append({
                        "id": qid,
                        "case_name": ex["case_name"],
                        "em": em,
                        "f1": f1,
                        "rouge1": r["rouge1"],
                        "rouge2": r["rouge2"],
                        "rougeL": r["rougeL"],
                        "hit@k": hit,
                        "mrr": mrr,
                        "ndcg": ndcg,
                        "oracle@k": oracle,
                        "pred": pred,
                        "gold": gold,
                        "question": question,
                        "relevant_sources": list(relevant_sources),
                        "retrieved": [
                            {
                                "source": it.get("metadata", {}).get("source"),
                                "score": it.get("score"),
                                "text": it.get("text"),
                            } for it in combined
                        ],
                    })

                agg = {
                    "N": len(records),
                    "EM": mean(r["em"] for r in records) if records else 0.0,
                    "F1": mean(r["f1"] for r in records) if records else 0.0,
                    "ROUGE1": mean(r["rouge1"] for r in records) if records else 0.0,
                    "ROUGE2": mean(r["rouge2"] for r in records) if records else 0.0,
                    "ROUGEL": mean(r["rougeL"] for r in records) if records else 0.0,
                    "Hit@k": mean(r["hit@k"] for r in records) if records else 0.0,
                    "MRR": mean(r["mrr"] for r in records) if records else 0.0,
                    "nDCG": mean(r["ndcg"] for r in records) if records else 0.0,
                    "Oracle@k": mean(r["oracle@k"] for r in records) if records else 0.0,
                }

                all_results[k] = {"aggregate": agg, "records": records}

                run_name = f"LLM_Gemini_{args.model_name.replace('/', '_')}_k{k}"
                if args.use_hyde:
                    run_name += "_hyde"
                run_dir = outdir / run_name
                ensure_dir(run_dir)
                save_json(run_dir / "aggregate.json", agg)
                df = pd.DataFrame(records)
                df.to_csv(run_dir / "per_record.csv", index=False)
                with open(run_dir / "records.jsonl", "w", encoding="utf-8") as f:
                    for r in records:
                        f.write(json.dumps(r, ensure_ascii=False) + "\n")
            return all_results

        llm_results = evaluate_llm_combined(args.k)

    # Combined summary table
    rows = []
    store_prefix = "HyDE_" if args.use_hyde else ""
    for name, res in [("StoreA_Acts", results_a), ("StoreB_Judgments", results_b)]:
        for k, obj in res.items():
            agg = obj["aggregate"]
            row = {"Store": f"{store_prefix}{name}", "k": k, **agg}
            rows.append(row)
    if args.use_llm:
        for k, obj in llm_results.items():
            agg = obj["aggregate"]
            row = {"Store": f"{store_prefix}LLM_Gemini_{args.model_name}", "k": k, **agg}
            rows.append(row)

    summary_df = pd.DataFrame(rows)
    summary_filename = "summary_hyde.csv" if args.use_hyde else "summary.csv"
    summary_df.to_csv(outdir / summary_filename, index=False)
    save_json(outdir / summary_filename.replace(".csv", ".json"), rows)

    print("\n=== Evaluation complete ===")
    print(f"Results saved under: {outdir}")


if __name__ == "__main__":
    main()
