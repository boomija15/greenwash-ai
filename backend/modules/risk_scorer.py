"""
risk_scorer.py
Biodiversity Risk Exposure Scoring Engine.
Computes greenwashing risk score and maps claims to SDG 15 targets.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

with open(DATA_DIR / "sdg15_targets.json") as f:
    SDG_TARGETS = json.load(f)

with open(DATA_DIR / "greenwashing_keywords.json") as f:
    KEYWORDS = json.load(f)

# Base weights per claim type
CLAIM_WEIGHTS = {
    "absolute": 40,
    "misleading": 30,
    "vague": 15
}

# Cert failure penalty weights
CERT_STATUS_PENALTIES = {
    "NOT_FOUND": 25,
    "EXPIRED": 20,
    "SCOPE_MISMATCH": 15,
    "NO_CERTS_CLAIMED": 10
}


def calculate_risk_score(
    claims: list[dict],
    cert_results: list[dict],
    red_flags: list[dict],
    has_proof_markers: bool,
    ai_generated_risk: dict
) -> dict:
    """
    Calculate comprehensive greenwashing risk score (0-100).
    Returns score, verdict, SDG targets affected, and score breakdown.
    """
    score = 0
    breakdown = []
    sdg_flags = {}

    # 1. Score each detected claim
    for claim in claims:
        base = CLAIM_WEIGHTS.get(claim["type"], 10)

        # Find SDG target for this claim phrase
        sdg_hit = _find_sdg_target(claim["phrase"])
        multiplier = sdg_hit["severity"] if sdg_hit else 1.0
        claim_score = base * multiplier

        score += claim_score
        breakdown.append({
            "source": f"Claim: '{claim['phrase']}'",
            "type": claim["type"],
            "points": round(claim_score, 1),
            "sdg_target": sdg_hit["target"] if sdg_hit else None
        })

        if sdg_hit:
            target_id = sdg_hit["target"]
            if target_id not in sdg_flags:
                sdg_flags[target_id] = SDG_TARGETS.get(target_id, {})
                sdg_flags[target_id]["target"] = target_id

    # 2. Penalise for failed certificates
    for cert in cert_results:
        penalty = CERT_STATUS_PENALTIES.get(cert["status"], 0)
        if penalty > 0:
            score += penalty
            breakdown.append({
                "source": f"Certificate: {cert['cert']} — {cert['status']}",
                "type": "cert_failure",
                "points": penalty,
                "sdg_target": None
            })

    # 3. Penalise for no proof markers when claims exist
    if not has_proof_markers and len(claims) > 0:
        score += 10
        breakdown.append({
            "source": "No verifiable proof markers found in description",
            "type": "missing_proof",
            "points": 10,
            "sdg_target": None
        })

    # 4. Penalise for linguistic red flags
    if len(red_flags) > 0:
        flag_penalty = min(len(red_flags) * 5, 20)
        score += flag_penalty
        breakdown.append({
            "source": f"{len(red_flags)} linguistic red flag(s) detected",
            "type": "linguistic_flags",
            "points": flag_penalty,
            "sdg_target": None
        })

    # 5. AI-generated content risk boost
    ai_boost = {"high": 15, "medium": 8, "low": 0}.get(ai_generated_risk.get("risk", "low"), 0)
    if ai_boost > 0:
        score += ai_boost
        breakdown.append({
            "source": f"Possible AI-generated greenwashing content detected",
            "type": "ai_generated_risk",
            "points": ai_boost,
            "sdg_target": None
        })

    final_score = min(round(score), 100)
    verdict = _classify_verdict(final_score)
    visibility_impact = _calculate_visibility_impact(final_score)

    return {
        "risk_score": final_score,
        "verdict": verdict,
        "sdg_targets_affected": list(sdg_flags.values()),
        "score_breakdown": breakdown,
        "visibility_impact": visibility_impact,
        "total_claims": len(claims),
        "total_cert_failures": sum(1 for c in cert_results if c["status"] != "VERIFIED")
    }


def _find_sdg_target(phrase: str) -> dict | None:
    """Find the SDG 15 target most relevant to a detected claim phrase."""
    phrase_lower = phrase.lower()
    for target_id, target_data in SDG_TARGETS.items():
        for keyword in target_data.get("keywords", []):
            if keyword.lower() in phrase_lower or phrase_lower in keyword.lower():
                return {
                    "target": target_id,
                    "label": target_data["label"],
                    "severity": target_data["severity"]
                }
    return None


def _classify_verdict(score: int) -> str:
    """Classify final verdict based on risk score."""
    if score < 20:
        return "VERIFIED"
    elif score < 50:
        return "REVIEW_REQUIRED"
    else:
        return "GREENWASHED"


def _calculate_visibility_impact(score: int) -> dict:
    """
    Calculate marketplace visibility impact based on risk score.
    Verified products get boosts; greenwashed products get demoted.
    """
    if score < 20:
        return {
            "action": "BOOST",
            "adjustment": "+25% search ranking",
            "badge": "✓ Verified Green Product",
            "badge_color": "green",
            "description": "Product eligible for verified sustainability badge and search promotion"
        }
    elif score < 50:
        return {
            "action": "HOLD",
            "adjustment": "No ranking change — pending review",
            "badge": "⚠ Under Review",
            "badge_color": "amber",
            "description": "Product listing held pending seller clarification or certification submission"
        }
    else:
        return {
            "action": "DEMOTE",
            "adjustment": "-40% search ranking",
            "badge": "✗ Unverified Claims",
            "badge_color": "red",
            "description": "Product demoted in search results until claims are verified or removed"
        }