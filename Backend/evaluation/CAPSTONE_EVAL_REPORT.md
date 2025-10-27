# Capstone Evaluation: RAG Retrieval Baseline on IndicLegalQA 10K (Revised)

This document records everything implemented to run a practical, Masters‑level evaluation of your Retrieval‑Augmented Generation (RAG) system using the new golden dataset “IndicLegalQA Dataset_10K_Revised.json”. The focus is on a solid, reproducible baseline that compares your two vector stores and reports core, widely accepted metrics (EM, F1, ROUGE and retrieval metrics). It avoids unnecessary complexity while remaining substantial for a capstone project.


Contents
- What we implemented (summary)
- Repository changes
- How to run the evaluation
- Metrics reported and definitions
- Outputs produced
- Suggested analysis and presentation (tables/figures)
- Tips, limitations, and next steps


What we implemented (summary)
1) Evaluation scripts
   - evaluation/eval_utils.py: Utility functions for metrics (EM, F1, ROUGE), fuzzy mapping from case_name → relevant sources, FAISS retriever wrapper, and retrieval metrics (Hit@k, MRR, nDCG, Oracle@k).
   - evaluation/run_evaluation.py: Main runner that loads the golden dataset, loads both FAISS stores, constructs relevance sets by fuzzy matching, runs a retrieval‑only QA baseline across k ∈ {5, 10, 20}, computes metrics, and saves results.

2) Metrics
   - End‑to‑end answer quality: Exact Match (EM), token F1 (SQuAD‑style), ROUGE‑1/ROUGE‑2/ROUGE‑L.
   - Retrieval quality: Hit@k, MRR, nDCG@k. Plus Oracle@k (whether any retrieved chunk contains the gold answer string after normalization).

3) Vector stores compared
   - Store A: FAISS index for Acts (scripts/faiss_acts)
   - Store B: FAISS index for Judgments (scripts/faiss_judgments)
   The runner auto‑discovers these paths, or you can pass them explicitly via CLI.

4) Practical baseline
   - Retrieval‑only heuristic answer: choose the single best sentence from the top‑1 retrieved chunk by token overlap with the question (no paid LLM needed). This provides a consistent, low‑cost baseline that still reflects retrieval quality differences.


Repository changes
- Backend/requirements.txt: Added minimal evaluation dependencies
  - rouge-score (ROUGE implementation)
  - rapidfuzz (fast fuzzy string match for case_name → source mapping)
  - pandas (tables/CSV export)
- Backend/evaluation/eval_utils.py: Metrics, fuzzy mapping utilities, FAISS retriever wrapper, helpers.
- Backend/evaluation/run_evaluation.py: End‑to‑end evaluation runner.
- Backend/evaluation/CAPSTONE_EVAL_REPORT.md: This document.

Paths we assume
- Golden dataset: Backend/evaluation/IndicLegalQA Dataset_10K_Revised.json (already present in your repo).
- FAISS stores:
  - Acts: either Backend/scripts/faiss_acts or Backend/faiss_acts
  - Judgments: either Backend/scripts/faiss_judgments or Backend/faiss_judgments
  If stored elsewhere, pass the paths via CLI flags (see below).


How to run the evaluation
1) Install requirements (ideally inside your project’s venv):
   - pip install -r Backend/requirements.txt

2) Build your FAISS vector stores if not already done:
   - python Backend/scripts/second_build_vector_stores.py
   This will create FAISS directories for Acts and Judgments.

3) Run the evaluation (default paths auto‑discovered):
   - python Backend/evaluation/run_evaluation.py

   Optional arguments:
   - --dataset "D:\\JurisDraft\\Backend\\evaluation\\IndicLegalQA Dataset_10K_Revised.json"
   - --faiss_a "D:\\JurisDraft\\Backend\\scripts\\faiss_acts"
   - --faiss_b "D:\\JurisDraft\\Backend\\scripts\\faiss_judgments"
   - --k 5 10 20  (you can change the k‑values)
   - --outdir "D:\\JurisDraft\\Backend\\evaluation\\results"

4) What the script does at runtime:
   - Loads the dataset and two FAISS stores.
   - Builds a catalog of possible sources from both stores by reading their docstore.json files (fast; no embeddings loaded).
   - Maps each sample’s case_name to a set of relevant sources via fuzzy matching (token‑set ratio ≥ 80) with exact substring matching as a first step.
   - For each store and for each k:
     - Runs a retrieval query for the question, takes top‑k results.
     - Produces a heuristic answer from the top‑1 chunk: the sentence with the highest token overlap with the question.
     - Computes EM, F1, ROUGE‑1/2/L against the gold answer; and Hit@k, MRR, nDCG@k, Oracle@k using the relevance sets.
   - Saves per‑record metrics and aggregates.


Metrics reported and definitions
- Exact Match (EM): 1 if the normalized predicted answer string exactly matches the normalized gold answer; else 0. Normalization: lowercase; remove punctuation and English articles; collapse whitespace.
- Token F1 (SQuAD‑style): F1 over token overlap between normalized prediction and gold.
- ROUGE‑1/ROUGE‑2/ROUGE‑L: F‑measure computed via rouge-score with stemming enabled.
- Hit@k: 1 if any of the top‑k retrieved items comes from a relevant source (as determined from case_name mapping); else 0.
- Mean Reciprocal Rank (MRR): reciprocal of the rank of the first relevant item in the top‑k list; 0 if none.
- nDCG@k: discounted gain with binary relevance; ideal DCG is 1.0; normalized by that ideal.
- Oracle@k: 1 if any retrieved chunk (within top‑k) contains the normalized gold answer string as a substring; else 0.


Outputs produced
The script writes into Backend/evaluation/results (or the directory you pass via --outdir):
- summary.csv and summary.json: One row per store×k with aggregate metrics
  - Columns: Store, k, N, EM, F1, ROUGE1, ROUGE2, ROUGEL, Hit@k, MRR, nDCG, Oracle@k
- StoreA_Acts_k{K}/
  - aggregate.json: Aggregated metrics for this store at k
  - per_record.csv: Per‑question metrics for quick analysis
  - records.jsonl: Per‑question full records including retrieved contexts (source, score, text)
- StoreB_Judgments_k{K}/
  - aggregate.json / per_record.csv / records.jsonl (same structure)

These files are ready for inclusion in your capstone report. Use summary.csv for main tables; use per_record.csv and records.jsonl for error analysis and case studies.


Suggested analysis and presentation (capstone ready)
1) Experimental setup (short paragraph)
   - Corpus: Acts and Judgments; chunk size 1000, overlap 200 (see scripts/first_process_corpus.py).
   - Embeddings: sentence-transformers/all‑MiniLM‑L6‑v2 (CPU/GPU as available).
   - Vector stores: FAISS indices for Acts and Judgments; batch ingestion for Judgments.
   - Dataset: IndicLegalQA 10K Revised; we use all samples for evaluation (no train/test split is required for a pure evaluation study).

2) Main results table
   - Report EM, F1, ROUGE‑L, Hit@k, MRR, nDCG for k ∈ {5,10,20} and both stores.
   - Discuss which store performs better and how results change with k.

3) Simple ablation (optional but recommended)
   - Change k (e.g., 1, 5, 10, 20) to show sensitivity.
   - Optionally switch the heuristic to use top‑3 chunks concatenated, and re‑run to see if that helps.

4) Error analysis (lightweight)
   - Sample 20–30 failures from per_record.csv where EM=0 and F1<0.3.
   - Inspect retrieved contexts and predictions; categorize errors: retrieval misses, partial overlap, answer wording mismatch, or wrong case_name mapping.
   - Include 3–5 concrete examples in the report appendix.

5) Efficiency note
   - Report approximate runtime on your machine (dataset size N, k values used, hardware).

6) Limitations
   - Relevance sets rely on fuzzy matching between case_name and metadata["source"]. If file names don’t include case names, mapping may be weak.
   - Heuristic answer extraction is simple and underestimates the potential of a full LLM reader. It’s still useful for comparing retrieval stores at low cost.

7) Next steps (if time allows)
   - Add an LLM reader with a short prompt plus citation format to measure end‑to‑end performance more realistically.
   - Add paired bootstrap for confidence intervals (optional for capstone).
   - Improve relevance mapping by enriching metadata during ingestion (e.g., parse titles from the first page and store in metadata).


Appendix: Implementation notes
- Fuzzy mapping thresholds: We use rapidfuzz token_set_ratio ≥ 80 after attempting exact substring matches. You can adjust this via eval_utils.match_relevant_sources threshold parameter.
- Safe loading: build_source_catalog_from_faiss reads docstore.json only to get sources without loading full embeddings. If your FAISS store lacks docstore.json, you can still run evaluation; however, relevance mapping will be empty and retrieval metrics will be limited to Oracle@k.
- Embedding model device: Automatically uses CUDA if available; else CPU.
- Normalization: English article removal is applied (a, an, the). If your dataset answers are multilingual, consider disabling article removal or enhancing normalization.


Attribution
- ROUGE: rouge-score library (Google Research)
- Fuzzy matching: rapidfuzz
- Vector store: LangChain FAISS
- Embeddings: sentence-transformers/all‑MiniLM‑L6‑v2


Contact
If you want this pipeline to call an LLM and add citation‑aware faithfulness metrics, we can extend run_evaluation.py to include a generator step and compute additional metrics while keeping the scope manageable for a capstone.



Optional: End-to-end LLM evaluation with Gemini (recommended for full answer scoring)
If you have access to Google Gemini (e.g., gemini-2.5-pro), you can evaluate the complete RAG answer produced by the LLM using the retrieved passages. This provides a more realistic, end-to-end measurement beyond the retrieval-only heuristic.

How it works
- The runner retrieves top-k passages from both vector stores (Acts and Judgments), concatenates them (capped by --max_passages), and builds a concise, citation-style prompt.
- It then calls Gemini to generate an answer constrained to the provided passages.
- EM, F1, and ROUGE are computed against the golden answers using the model’s output. Retrieval metrics are computed on the combined retrieved list.

Enabling LLM evaluation
1) Ensure dependency is installed (already in requirements):
   - pip install -r Backend/requirements.txt
2) Set your API key securely (do not hardcode keys into code or commit history):
   - PowerShell (Windows):
     - $env:GOOGLE_API_KEY = "<YOUR_API_KEY>"
   - Or pass via CLI flag --gemini_key (less recommended; shell history may store it).
3) Run with --use_llm:
   - python Backend/evaluation/run_evaluation.py --use_llm --model_name "gemini-2.5-pro" --k 5 10 --max_passages 10 --max_output_tokens 512
   - You can also specify --gemini_key "<YOUR_API_KEY>" if you prefer not to set an environment variable.

Flags
- --use_llm: Enable LLM-based evaluation.
- --model_name: Gemini model to use (default: gemini-2.5-pro).
- --gemini_key: API key (optional if GOOGLE_API_KEY or GEMINI_API_KEY is set).
- --max_passages: Maximum number of retrieved passages included in the prompt across both stores (default: 10).
- --max_output_tokens: Max tokens for the model’s output (default: 512).

Outputs
- Results are saved under Backend/evaluation/results similar to the retrieval baseline, with an additional directory per k:
  - LLM_Gemini_{model}_k{K}/ containing aggregate.json, per_record.csv, and records.jsonl.
- summary.csv/summary.json include an extra row per k for the LLM run with Store="LLM_Gemini_{model}".

Notes and cautions
- Costs and latency: Using an LLM incurs API costs and is slower than the heuristic. Consider running on a subset for quick checks.
- Key handling: Prefer environment variables. Avoid committing keys or placing them in the report.
- Prompting: The prompt enforces citation-style answers to improve faithfulness. You can inspect the records.jsonl to review prompts and outputs.
- If the LLM call fails, the runner gracefully falls back to the retrieval-only heuristic for that sample.
