"""
predictive_engine.py
Predictive greenwashing detection — tracks seller recidivism
and generates early alerts for high-risk listing patterns.
"""

from datetime import datetime
from collections import defaultdict

# In-memory store for MVP (replace with DB in production)
SUBMISSION_HISTORY: list[dict] = []
SELLER_PROFILES: dict[str, dict] = {}


def record_submission(company: str, product: str, verdict: str, risk_score: int, claims: list):
    """Record a product submission for recidivism tracking."""
    entry = {
        "company": company,
        "product": product,
        "verdict": verdict,
        "risk_score": risk_score,
        "claim_count": len(claims),
        "timestamp": datetime.now().isoformat(),
        "claim_phrases": [c["phrase"] for c in claims]
    }
    SUBMISSION_HISTORY.append(entry)
    _update_seller_profile(company, entry)


def _update_seller_profile(company: str, entry: dict):
    """Update cumulative seller risk profile."""
    if company not in SELLER_PROFILES:
        SELLER_PROFILES[company] = {
            "company": company,
            "total_submissions": 0,
            "greenwashed_count": 0,
            "review_count": 0,
            "verified_count": 0,
            "total_risk_score": 0,
            "recurring_phrases": defaultdict(int),
            "first_seen": entry["timestamp"],
            "last_seen": entry["timestamp"],
            "alert_level": "LOW"
        }

    profile = SELLER_PROFILES[company]
    profile["total_submissions"] += 1
    profile["total_risk_score"] += entry["risk_score"]
    profile["last_seen"] = entry["timestamp"]

    if entry["verdict"] == "GREENWASHED":
        profile["greenwashed_count"] += 1
    elif entry["verdict"] == "REVIEW_REQUIRED":
        profile["review_count"] += 1
    else:
        profile["verified_count"] += 1

    for phrase in entry["claim_phrases"]:
        profile["recurring_phrases"][phrase] += 1

    # Update alert level
    profile["alert_level"] = _compute_alert_level(profile)
    profile["avg_risk_score"] = round(profile["total_risk_score"] / profile["total_submissions"])
    profile["recurring_phrases"] = dict(profile["recurring_phrases"])


def _compute_alert_level(profile: dict) -> str:
    """Compute seller alert level based on recidivism pattern."""
    greenwash_rate = profile["greenwashed_count"] / max(profile["total_submissions"], 1)

    if greenwash_rate >= 0.6 or profile["greenwashed_count"] >= 3:
        return "HIGH"
    elif greenwash_rate >= 0.3 or profile["greenwashed_count"] >= 2:
        return "MEDIUM"
    else:
        return "LOW"


def get_seller_risk_profile(company: str) -> dict:
    """Get risk profile for a specific seller."""
    return SELLER_PROFILES.get(company, {
        "company": company,
        "total_submissions": 0,
        "alert_level": "LOW",
        "message": "No prior submission history found"
    })


def get_early_alerts() -> list[dict]:
    """Get list of high-risk sellers for regulator early alert dashboard."""
    alerts = []
    for company, profile in SELLER_PROFILES.items():
        if profile["alert_level"] in ["HIGH", "MEDIUM"]:
            # Find most repeated problematic phrases
            recurring = sorted(
                [(phrase, count) for phrase, count in profile.get("recurring_phrases", {}).items() if count > 1],
                key=lambda x: x[1], reverse=True
            )[:3]

            alerts.append({
                "company": company,
                "alert_level": profile["alert_level"],
                "greenwashed_count": profile["greenwashed_count"],
                "total_submissions": profile["total_submissions"],
                "avg_risk_score": profile.get("avg_risk_score", 0),
                "recurring_patterns": [{"phrase": p, "occurrences": c} for p, c in recurring],
                "recommended_action": _recommend_action(profile),
                "last_seen": profile["last_seen"]
            })

    return sorted(alerts, key=lambda x: (x["alert_level"] == "HIGH", x["greenwashed_count"]), reverse=True)


def _recommend_action(profile: dict) -> str:
    """Generate recommended regulatory action based on alert level."""
    if profile["alert_level"] == "HIGH":
        return "Escalate for formal investigation — pattern of repeated greenwashing detected"
    elif profile["alert_level"] == "MEDIUM":
        return "Issue warning notice and require certification submission within 14 days"
    return "Monitor — flag for review if next submission is also non-compliant"


def get_all_submissions() -> list[dict]:
    """Return all submission history for regulator audit log."""
    return list(reversed(SUBMISSION_HISTORY))


def get_platform_stats() -> dict:
    """Aggregate stats for regulator dashboard."""
    if not SUBMISSION_HISTORY:
        return {
            "total_scanned": 0, "greenwashed": 0,
            "under_review": 0, "verified": 0,
            "high_risk_sellers": 0, "avg_risk_score": 0
        }

    verdicts = [s["verdict"] for s in SUBMISSION_HISTORY]
    return {
        "total_scanned": len(SUBMISSION_HISTORY),
        "greenwashed": verdicts.count("GREENWASHED"),
        "under_review": verdicts.count("REVIEW_REQUIRED"),
        "verified": verdicts.count("VERIFIED"),
        "high_risk_sellers": sum(1 for p in SELLER_PROFILES.values() if p["alert_level"] == "HIGH"),
        "avg_risk_score": round(sum(s["risk_score"] for s in SUBMISSION_HISTORY) / len(SUBMISSION_HISTORY))
    }