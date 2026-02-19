"""
main.py
GreenWatch AI — FastAPI Backend
Greenwashing Detection System aligned with SDG Goal 15
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn

from modules.nlp_engine import extract_claims
from modules.cert_matcher import verify_certificates
from modules.risk_scorer import calculate_risk_score
from modules.predictive_engine import (
    record_submission,
    get_seller_risk_profile,
    get_early_alerts,
    get_all_submissions,
    get_platform_stats
)

app = FastAPI(
    title="GreenWatch AI — Greenwashing Detection API",
    description="AI-powered greenwashing detection aligned with SDG Goal 15: Life on Land",
    version="0.1.0"
)

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request / Response Models ────────────────────────────────────────────────

class ProductSubmission(BaseModel):
    company_name: str = Field(..., example="GreenWood Ltd")
    product_title: str = Field(..., example="Sustainable Bamboo Desk")
    product_description: str = Field(..., example="100% eco-friendly, sustainably sourced timber...")
    product_category: str = Field(..., example="timber")
    claimed_certifications: list[str] = Field(default=[], example=["FSC", "Carbon Trust"])

class LiveTextRequest(BaseModel):
    text: str


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "GreenWatch AI",
        "version": "0.1.0",
        "status": "running",
        "sdg_alignment": "Goal 15 — Life on Land"
    }


@app.post("/analyze")
def analyze_product(submission: ProductSubmission):
    """
    Full greenwashing analysis pipeline.
    Extracts claims, verifies certificates, scores risk, maps to SDG 15.
    """
    full_text = f"{submission.product_title}. {submission.product_description}"

    # Stage 1: NLP extraction
    nlp_result = extract_claims(full_text)
    claims = nlp_result["claims"]
    red_flags = nlp_result["red_flags"]
    has_proof = nlp_result["has_proof_markers"]
    ai_risk = nlp_result["is_ai_generated_risk"]

    # Stage 2: Certificate verification
    cert_result = verify_certificates(
        submission.company_name,
        submission.claimed_certifications,
        submission.product_category
    )
    cert_verifications = cert_result["verification_results"]

    # Stage 3: Risk scoring
    risk = calculate_risk_score(claims, cert_verifications, red_flags, has_proof, ai_risk)

    # Stage 4: SDG mapping


    # Stage 5: Get prior seller profile for recidivism context
    prior_profile = get_seller_risk_profile(submission.company_name)

    # Record this submission
    record_submission(
        submission.company_name,
        submission.product_title,
        risk["verdict"],
        risk["risk_score"],
        claims
    )

    return {
        "product": {
            "title": submission.product_title,
            "company": submission.company_name,
            "category": submission.product_category
        },
        "nlp_analysis": {
            "claims_detected": claims,
            "red_flags": red_flags,
            "has_proof_markers": has_proof,
            "ai_generated_risk": ai_risk,
            "claim_count": nlp_result["claim_count"]
        },
        "certificate_analysis": {
            "verification_results": cert_verifications,
            "missing_recommended": cert_result["missing_recommended"],
            "overall_cert_status": cert_result["overall_cert_status"]
        },
        "risk_assessment": {
            "risk_score": risk["risk_score"],
            "verdict": risk["verdict"],
            "score_breakdown": risk["score_breakdown"],
            "visibility_impact": risk["visibility_impact"]
        },
        "seller_history": {
            "alert_level": prior_profile.get("alert_level", "LOW"),
            "prior_submissions": prior_profile.get("total_submissions", 0),
            "prior_greenwash_count": prior_profile.get("greenwashed_count", 0)
        }
    }


@app.post("/analyze-live")
def analyze_live(request: LiveTextRequest):
    """
    Real-time claim interception as seller types.
    Returns immediate warnings for greenwashing phrases.
    Lightweight — keyword matching only, no cert check.
    """
    nlp_result = extract_claims(request.text)

    warnings = []
    for claim in nlp_result["claims"]:
        warnings.append({
            "phrase": claim["phrase"],
            "type": claim["type"],
            "warning": _live_warning_message(claim["type"])
        })

    for flag in nlp_result["red_flags"]:
        warnings.append({
            "phrase": flag["pattern"],
            "type": "linguistic_flag",
            "warning": flag["description"]
        })

    return {
        "warnings": warnings,
        "warning_count": len(warnings),
        "has_proof_markers": nlp_result["has_proof_markers"]
    }


@app.get("/seller/{company_name}/profile")
def seller_profile(company_name: str):
    """Get risk profile and submission history for a specific seller."""
    return get_seller_risk_profile(company_name)


@app.get("/regulator/alerts")
def early_alerts():
    """Get early alert list of high-risk sellers for regulator dashboard."""
    return {"alerts": get_early_alerts()}


@app.get("/regulator/submissions")
def all_submissions():
    """Get full audit log of all submissions."""
    return {"submissions": get_all_submissions()}


@app.get("/regulator/stats")
def platform_stats():
    """Get aggregate platform statistics for regulator overview."""
    return get_platform_stats()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _live_warning_message(claim_type: str) -> str:
    messages = {
        "vague": "Vague claim — consider adding a specific certified standard",
        "absolute": "Absolute claim — requires third-party certification to substantiate",
        "misleading": "Potentially misleading — must be backed by a recognized eco-label"
    }
    return messages.get(claim_type, "Environmental claim detected — verification recommended")


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 