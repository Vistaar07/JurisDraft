"""
RAG Configuration for Legal Document System
File: rag_config.py

Core Components:
- ComplianceChecker: Checks documents for compliance issues and loopholes
- DocumentGenerator: Generates legal documents with checklist integration
- RAGConfig: Manages FAISS vector stores, embeddings, and LLM

Model: Gemini 2.5 Pro (google-generativeai)
Vector Store: FAISS with HuggingFace Embeddings ('mixedbread-ai/mxbai-embed-large-v1')
Checklist: all_document_checklists.json

Features:
- Retrieves relevant legal provisions from FAISS acts database
- Validates documents against checklist requirements
- Generates compliant documents with structured prompts
"""

import json
from typing import List, Dict, Any, Optional
from pathlib import Path

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel, Field


# ============================================================================
# Models
# ============================================================================

class ChecklistItem(BaseModel):
    """Single checklist item"""
    topic: str
    description: str
    risk_level: str
    supporting_evidence: List[Dict[str, str]] = Field(default_factory=list)


class LoopholeItem(BaseModel):
    """Detected loophole"""
    title: str
    description: str
    risk_level: str
    clause_reference: str
    recommendation: str


class ComplianceItem(BaseModel):
    """Compliance check result"""
    requirement: str
    status: str  # Compliant/Non-Compliant/Partially Compliant
    details: str
    relevant_acts: List[str] = Field(default_factory=list)
    remediation: Optional[str] = None


class ComplianceResult(BaseModel):
    """Complete compliance check result"""
    document_type: str
    compliance_checks: List[ComplianceItem]
    loopholes: List[LoopholeItem]
    overall_risk_score: float
    risk_level: str
    summary: str
    recommendations: List[str]


# ============================================================================
# RAG Configuration
# ============================================================================

class RAGConfig:
    """RAG system configuration and initialization"""

    def __init__(self, base_path: str = None):
        if base_path is None:
            base_path = Path(__file__).parent.parent

        self.base_path = Path(base_path)
        self.config_path = self.base_path / "config"
        self.faiss_path = self.base_path / "faiss_index"

        # Load API keys
        self.api_keys = self._load_api_keys()

        # Initialize embeddings and LLM
        # Use the exact embedding model used to build FAISS: 'mixedbread-ai/mxbai-embed-large-v1'
        self.embeddings = HuggingFaceEmbeddings(model_name="mixedbread-ai/mxbai-embed-large-v1")

        # LLM: Gemini 2.5 Pro
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro",
            google_api_key=self.api_keys.get("GOOGLE_API_KEY"),
            temperature=0.3,
            max_output_tokens=8192
        )

        # Load vector stores
        self.vectorstore_acts = None
        self.vectorstore_judgments = None
        self._load_vector_stores()

        # Load checklist
        self.checklists = self._load_checklists()

    def _load_api_keys(self) -> Dict[str, str]:
        """Load API keys from config"""
        api_keys_file = self.config_path / "api_keys.json"
        try:
            with open(api_keys_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load API keys: {e}")
            return {}

    def _load_vector_stores(self):
        """Load FAISS vector stores"""
        try:
            acts_path = self.faiss_path / "faiss_acts"
            judgments_path = self.faiss_path / "faiss_judgments"

            if acts_path.exists():
                self.vectorstore_acts = FAISS.load_local(
                    str(acts_path),
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print("✓ Loaded Acts vector store")

            if judgments_path.exists():
                self.vectorstore_judgments = FAISS.load_local(
                    str(judgments_path),
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print("✓ Loaded Judgments vector store")

        except Exception as e:
            print(f"Warning: Could not load vector stores: {e}")

    def _load_checklists(self) -> Dict[str, Any]:
        """Load all_document_checklists.json"""
        checklists = {}

        try:
            checklist_file = self.config_path / "all_document_checklists.json"
            if checklist_file.exists():
                with open(checklist_file, 'r') as f:
                    checklists = json.load(f)
                print(f"✓ Loaded checklists for {len(checklists)} document types")

        except Exception as e:
            print(f"Warning: Could not load checklists: {e}")

        return checklists


# ============================================================================
# Compliance Checker
# ============================================================================

class ComplianceChecker:
    """Checks document compliance using checklist and FAISS retrieval"""

    def __init__(self, rag_config: RAGConfig):
        self.config = rag_config
        self.llm = rag_config.llm
        self.vectorstore_acts = rag_config.vectorstore_acts
        self.checklists = rag_config.checklists

    def check_document(
        self,
        document_text: str,
        document_type: str,
        jurisdiction: str = "India"
    ) -> ComplianceResult:
        """
        Check document for compliance issues and loopholes

        Args:
            document_text: Full document text
            document_type: Type of document (e.g., 'nda', 'offer_letter')
            jurisdiction: Legal jurisdiction

        Returns:
            ComplianceResult with findings
        """

        # Get checklist for document type
        doc_type_key = document_type.lower().replace(" ", "_")
        checklist_data = self.checklists.get(doc_type_key, {})

        if not checklist_data:
            raise ValueError(f"No checklist found for document type: {document_type}")

        checklist_items = checklist_data.get("checklist_items", [])
        governing_acts = checklist_data.get("governing_acts", [])

        print(f"Checking {document_type} with {len(checklist_items)} checklist items...")

        compliance_checks: List[ComplianceItem] = []
        loopholes: List[LoopholeItem] = []

        for item in checklist_items:
            check_result = self._check_item(
                document_text,
                item,
                governing_acts,
                document_type
            )

            if check_result["type"] == "compliance":
                compliance_checks.append(check_result["item"])  # type: ignore[arg-type]
            else:
                loopholes.append(check_result["item"])  # type: ignore[arg-type]

        # Calculate risk score
        risk_score = self._calculate_risk_score(compliance_checks, loopholes)
        risk_level = self._get_risk_level(risk_score)

        # Generate summary and recommendations
        summary = self._generate_summary(
            document_type,
            compliance_checks,
            loopholes,
            risk_score,
            risk_level
        )

        recommendations = self._generate_recommendations(
            compliance_checks,
            loopholes
        )

        return ComplianceResult(
            document_type=document_type,
            compliance_checks=compliance_checks,
            loopholes=loopholes,
            overall_risk_score=risk_score,
            risk_level=risk_level,
            summary=summary,
            recommendations=recommendations
        )

    def _check_item(
        self,
        document_text: str,
        checklist_item: Dict,
        governing_acts: List[str],
        document_type: str
    ) -> Dict[str, Any]:
        """Check a single checklist item against the document"""

        # Structured prompt template for compliance checking
        topic = checklist_item.get("topic", "")
        description = checklist_item.get("description", "")
        risk_level = checklist_item.get("risk_level", "Medium")

        legal_context = self._get_legal_context(topic, description, governing_acts)

        prompt = f"""You are an expert legal analyst specializing in Indian law, specifically in reviewing {document_type} documents.

Your task is to analyze if the provided document meets a specific legal/compliance requirement.

=== CHECKLIST ITEM TO VERIFY ===
Topic: {topic}
Requirement: {description}
Risk Level: {risk_level}

=== RELEVANT LEGAL PROVISIONS ===
{legal_context}

=== DOCUMENT TEXT (excerpt) ===
{document_text[:2500]}

=== ANALYSIS INSTRUCTIONS ===
Carefully analyze the document against the checklist requirement. Consider:
1. Does the document explicitly address this requirement?
2. If addressed, is it adequate and compliant with legal standards?
3. Are there any loopholes or weaknesses in how it's addressed?
4. What specific clause or section addresses (or should address) this?

=== OUTPUT FORMAT ===
Respond ONLY with a valid JSON object in this exact format:
{{
    "is_compliant": true or false,
    "has_loophole": true or false,
    "clause_reference": "Quote the specific clause text, or write 'Not Found' if missing",
    "explanation": "Detailed explanation of your analysis (2-3 sentences)",
    "recommendation": "Specific, actionable recommendation to fix or improve (if needed)"
}}

DO NOT include any text before or after the JSON object.
"""

        try:
            response = self.llm.invoke(prompt)
            response_text = response.content.strip()
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)

                # Create compliance item or loophole
                if not result.get("is_compliant", True) or result.get("has_loophole", False):
                    if result.get("has_loophole", False):
                        return {
                            "type": "loophole",
                            "item": LoopholeItem(
                                title=topic,
                                description=result.get("explanation", description),
                                risk_level=risk_level,
                                clause_reference=result.get("clause_reference", "Not specified"),
                                recommendation=result.get("recommendation", "Review and revise")
                            )
                        }
                    else:
                        return {
                            "type": "compliance",
                            "item": ComplianceItem(
                                requirement=topic,
                                status="Non-Compliant",
                                details=result.get("explanation", description),
                                relevant_acts=governing_acts,
                                remediation=result.get("recommendation", "Add missing clause")
                            )
                        }
                else:
                    return {
                        "type": "compliance",
                        "item": ComplianceItem(
                            requirement=topic,
                            status="Compliant",
                            details=result.get("explanation", "Requirement met"),
                            relevant_acts=governing_acts,
                            remediation=None
                        )
                    }

        except Exception as e:
            print(f"Error checking item '{topic}': {e}")
            # Return as non-compliant on error
            return {
                "type": "compliance",
                "item": ComplianceItem(
                    requirement=topic,
                    status="Partially Compliant",
                    details=f"Unable to fully verify: {str(e)[:100]}",
                    relevant_acts=governing_acts,
                    remediation="Manual review recommended"
                )
            }
        # Default safeguard return (if parsing produced no branch)
        return {
            "type": "compliance",
            "item": ComplianceItem(
                requirement=topic,
                status="Partially Compliant",
                details="No decisive output from LLM; manual review recommended",
                relevant_acts=governing_acts,
                remediation="Manual review recommended"
            )
        }

    def _get_legal_context(
        self,
        topic: str,
        description: str,
        governing_acts: List[str]
    ) -> str:
        """Retrieve relevant legal provisions from FAISS"""

        if not self.vectorstore_acts:
            return "Vector store not available"

        try:
            # Search query combining topic and acts
            query = f"{topic} {description} {' '.join(governing_acts)}"
            results = self.vectorstore_acts.similarity_search(query, k=3)

            context = "\n\n".join([
                f"[{doc.metadata.get('source', 'Legal Act')}]\n{doc.page_content[:500]}"
                for doc in results
            ])

            return context if context else "No specific provisions found"

        except Exception as e:
            print(f"Error retrieving legal context: {e}")
            return "Legal context retrieval failed"

    def _calculate_risk_score(
        self,
        compliance_checks: List[ComplianceItem],
        loopholes: List[LoopholeItem]
    ) -> float:
        """Calculate overall risk score (0-10)"""

        score = 0.0

        # Loophole scoring
        risk_scores = {"High": 2.5, "Medium": 1.5, "Low": 0.5}
        for loophole in loopholes:
            score += risk_scores.get(loophole.risk_level, 1.0)

        # Compliance scoring
        for check in compliance_checks:
            if check.status == "Non-Compliant":
                score += 2.0
            elif check.status == "Partially Compliant":
                score += 1.0

        return min(10.0, score)

    def _get_risk_level(self, score: float) -> str:
        """Convert risk score to level"""
        if score >= 7.0:
            return "HIGH"
        elif score >= 4.0:
            return "MEDIUM"
        else:
            return "LOW"

    def _generate_summary(
        self,
        document_type: str,
        compliance_checks: List[ComplianceItem],
        loopholes: List[LoopholeItem],
        risk_score: float,
        risk_level: str
    ) -> str:
        """Generate analysis summary"""

        non_compliant = len([c for c in compliance_checks if c.status == "Non-Compliant"])
        high_risk_loopholes = len([l for l in loopholes if l.risk_level == "High"])

        summary = f"""Compliance Analysis - {document_type.replace('_', ' ').title()}

Risk Level: {risk_level} (Score: {risk_score:.1f}/10)

Findings:
- {len(compliance_checks)} compliance checks performed
  • {non_compliant} non-compliant items
- {len(loopholes)} loopholes detected
  • {high_risk_loopholes} high-risk issues

{'⚠️ CRITICAL: Immediate legal review required' if risk_score >= 7 else '⚠️ Review and revise before execution' if risk_score >= 4 else '✓ Generally acceptable with minor issues'}
"""

        return summary.strip()

    def _generate_recommendations(
        self,
        compliance_checks: List[ComplianceItem],
        loopholes: List[LoopholeItem]
    ) -> List[str]:
        """Generate actionable recommendations"""

        recommendations: List[str] = []
        # High-risk loopholes first
        for loophole in loopholes:
            if loophole.risk_level == "High":
                recommendations.append(f"[High] {loophole.title}: {loophole.recommendation}")

        # Non-compliant items
        for check in compliance_checks:
            if check.status == "Non-Compliant" and check.remediation:
                recommendations.append(f"[Compliance] {check.requirement}: {check.remediation}")

        # Medium-risk loopholes
        for loophole in loopholes:
            if loophole.risk_level == "Medium":
                recommendations.append(f"[Medium] {loophole.title}: {loophole.recommendation}")

        return recommendations[:10]  # Top 10 recommendations


# ============================================================================
# Document Generator
# ============================================================================

class DocumentGenerator:
    """Generates legal documents using checklist and FAISS retrieval"""

    def __init__(self, rag_config: RAGConfig):
        self.config = rag_config
        self.llm = rag_config.llm
        self.vectorstore_acts = rag_config.vectorstore_acts
        self.checklists = rag_config.checklists

    def generate_document(
        self,
        document_type: str,
        user_inputs: Dict[str, Any],
        jurisdiction: str = "India",
        output_format: str = "markdown",
        include_sources: bool = True
    ) -> str:
        """
        Generate a legal document using checklist and retrieved legal provisions.
        Only Indian legal domain is supported.

        Args:
            document_type: Type of document to generate
            user_inputs: User-provided details (parties, terms, etc.)
            jurisdiction: Must be 'India'
            output_format: 'markdown' | 'html' | 'text'
            include_sources: Include references/footnotes section
        """

        # Enforce Indian legal domain
        if jurisdiction.strip().lower() != "india":
            raise ValueError("Only Indian legal domain is supported. Set jurisdiction='India'.")

        # Normalize output format
        fmt = output_format.lower()
        if fmt not in {"markdown", "html", "text"}:
            fmt = "markdown"

        # Get checklist for document type
        doc_type_key = document_type.lower().replace(" ", "_")
        checklist_data = self.checklists.get(doc_type_key, {})
        if not checklist_data:
            raise ValueError(f"No checklist found for document type: {document_type}")
        display_name = checklist_data.get("display_name", document_type)
        checklist_items = checklist_data.get("checklist_items", [])
        governing_acts = checklist_data.get("governing_acts", [])

        print(f"Generating {display_name} with {len(checklist_items)} checklist requirements...")
        legal_context = self._retrieve_legal_provisions(
            document_type,
            checklist_items,
            governing_acts
        )
        checklist_text = self._build_checklist_requirements(checklist_items)
        user_inputs_text = self._build_user_inputs_text(user_inputs)

        document = self._generate_with_llm(
            display_name,
            governing_acts,
            legal_context,
            checklist_text,
            user_inputs_text,
            jurisdiction,
            fmt,
            include_sources
        )
        return document

    def _retrieve_legal_provisions(
        self,
        document_type: str,
        checklist_items: List[Dict],
        governing_acts: List[str]
    ) -> str:
        """Retrieve relevant legal provisions from FAISS"""

        if not self.vectorstore_acts:
            return "Legal provisions database not available."

        try:
            # Build comprehensive query from checklist topics
            topics = [item.get("topic", "") for item in checklist_items]
            query = f"{document_type} {' '.join(topics[:5])} {' '.join(governing_acts)}"

            # Retrieve relevant chunks
            results = self.vectorstore_acts.similarity_search(query, k=5)

            provisions = []
            for i, doc in enumerate(results, 1):
                source = doc.metadata.get('source', 'Legal Act')
                provisions.append(f"PROVISION {i} [{source}]:\n{doc.page_content[:600]}\n")

            return "\n".join(provisions)

        except Exception as e:
            print(f"Error retrieving legal provisions: {e}")
            return f"Provisions from: {', '.join(governing_acts)}"

    def _build_checklist_requirements(self, checklist_items: List[Dict]) -> str:
        """Build checklist requirements text"""

        requirements = []
        for i, item in enumerate(checklist_items, 1):
            topic = item.get("topic", "")
            description = item.get("description", "")
            risk_level = item.get("risk_level", "")
            requirements.append(f"{i}. {topic} [{risk_level}]\n   {description}")

        return "\n\n".join(requirements)

    def _build_user_inputs_text(self, user_inputs: Dict[str, Any]) -> str:
        """Build user inputs text"""

        if not user_inputs:
            return "No specific user inputs provided."

        inputs = []
        for key, value in user_inputs.items():
            inputs.append(f"- {key.replace('_', ' ').title()}: {value}")

        return "\n".join(inputs)

    def _generate_with_llm(
        self,
        document_name: str,
        governing_acts: List[str],
        legal_context: str,
        checklist_requirements: str,
        user_inputs: str,
        jurisdiction: str,
        output_format: str = "markdown",
        include_sources: bool = True
    ) -> str:
        """Generate document using LLM with structured prompt template"""

        # Format instructions
        if output_format == "markdown":
            format_instructions = (
                "Output format: Markdown. Use #, ##, ### headings; numbered lists for clauses; tables only if essential."
            )
        elif output_format == "html":
            format_instructions = (
                "Output format: HTML. Use <h1>-<h3> for headings, <ol>/<li> for numbered clauses, <p> for paragraphs."
            )
        else:
            format_instructions = (
                "Output format: Plain text with clear headings and numbered clauses."
            )

        sources_instructions = (
            "Include a final 'References' section listing the legal provisions used (with source filenames if available)."
            if include_sources else "Do not include a References section."
        )

        # Comprehensive prompt template for Indian legal documents
        prompt = f"""You are an expert Indian legal document drafter.
Draft a comprehensive, legally sound {document_name} strictly under Indian law.

{format_instructions}
{sources_instructions}

=== GOVERNING LEGISLATION (India) ===
{chr(10).join(f'• {act}' for act in governing_acts)}

=== RELEVANT STATUTORY PROVISIONS (retrieved) ===
{legal_context[:3500]}

=== MANDATORY REQUIREMENTS (Checklist - all must be addressed) ===
{checklist_requirements}

=== USER-PROVIDED DETAILS ===
{user_inputs}

=== DRAFTING INSTRUCTIONS ===
1. Use formal, professional legal language for Indian contracts.
2. Structure with clear numbered sections and subsections.
3. Address EVERY checklist requirement explicitly.
4. Align clauses with the governing Indian statutes listed above.
5. Include standard Indian clauses: Notices, Severability, Waiver, Assignment, Force Majeure, etc.
6. Use defined terms consistently (capitalize and provide a Definitions section if needed).
7. Ensure dates, names, places, and consideration are correctly reflected.
8. Add Recitals (WHEREAS) contextualizing the arrangement.
9. Include Dispute Resolution (Arbitration under Arbitration and Conciliation Act, 1996 unless a court forum is specified) and Governing Law/Jurisdiction within India.
10. Include Execution/Signatures with place and date within India.

=== REQUIRED STRUCTURE ===
- Title
- Parties (full legal names and addresses)
- Recitals
- Definitions (if appropriate)
- Main Clauses (covering all checklist items)
- Term and Termination
- Representations and Warranties (if applicable)
- Indemnity and Limitation of Liability (if applicable)
- Confidentiality / IP (as relevant)
- Compliance with Laws
- Notices
- Governing Law and Jurisdiction (India)
- Dispute Resolution (Arbitration or Courts in [City], India)
- Miscellaneous (Entire Agreement, Amendments, Severability, Waiver, Assignment)
- Execution / Signatures

Generate the complete {document_name} now.
"""

        try:
            response = self.llm.invoke(prompt)
            document = response.content.strip()
            return document

        except Exception as e:
            raise Exception(f"Document generation failed: {str(e)}")


# ============================================================================
# Factory Functions
# ============================================================================

def create_compliance_checker(base_path: str = None) -> ComplianceChecker:
    """Create a ComplianceChecker instance"""
    rag_config = RAGConfig(base_path)
    return ComplianceChecker(rag_config)


def create_document_generator(base_path: str = None) -> DocumentGenerator:
    """Create a DocumentGenerator instance"""
    rag_config = RAGConfig(base_path)
    return DocumentGenerator(rag_config)

# Note: Compliance and file-upload API endpoints have been moved to
# `api_compliance.py` to keep this module focused on core RAG logic.
