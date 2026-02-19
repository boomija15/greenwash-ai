"""
cert_matcher.py
Certificate cross-reference and scope matching engine.
Checks existence, validity, expiry, and product category applicability.
"""

import json
from datetime import datetime, date
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

with open(DATA_DIR / "cert_registry.json") as f:
    REGISTRY = json.load(f)

# Certification guidance for SME remediation pathways
CERT_GUIDANCE = {
    "FSC": {
        "full_name": "Forest Stewardship Council",
        "url": "https://fsc.org/en/for-business/certification",
        "timeline": "3–6 months",
        "cost_tier": "Low–Medium (₹50,000–₹2,00,000)",
        "description": "Required for timber, paper, wood-based, and packaging products",
        "steps": [
            "Contact an FSC-accredited certification body in your region",
            "Undergo a forest management or chain-of-custody audit",
            "Implement required changes and corrective actions",
            "Receive FSC certificate valid for 5 years with annual audits"
        ]
    },
    "PEFC": {
        "full_name": "Programme for Endorsement of Forest Certification",
        "url": "https://pefc.org/find-certified/certified-businesses",
        "timeline": "2–4 months",
        "cost_tier": "Low (₹30,000–₹1,00,000)",
        "description": "Alternative to FSC for forest and paper product certification",
        "steps": [
            "Apply through a PEFC-endorsed national scheme",
            "Complete chain-of-custody certification process",
            "Annual surveillance audits required"
        ]
    },
    "Rainforest Alliance": {
        "full_name": "Rainforest Alliance Certification",
        "url": "https://www.rainforest-alliance.org/business/certification",
        "timeline": "4–8 months",
        "cost_tier": "Medium (₹75,000–₹3,00,000)",
        "description": "For agricultural commodities, food, and beverage products",
        "steps": [
            "Register on the Rainforest Alliance certification portal",
            "Complete a self-assessment against the 2020 Sustainable Agriculture Standard",
            "Schedule a third-party audit",
            "Implement required sustainability practices"
        ]
    },
    "ISO 14001": {
        "full_name": "ISO 14001 Environmental Management System",
        "url": "https://www.iso.org/iso-14001-environmental-management.html",
        "timeline": "6–12 months",
        "cost_tier": "Medium–High (₹1,00,000–₹5,00,000)",
        "description": "Environmental management system standard applicable to any industry",
        "steps": [
            "Conduct a gap analysis against ISO 14001:2015 requirements",
            "Develop and implement an Environmental Management System (EMS)",
            "Complete internal audits and management review",
            "Apply for third-party certification audit"
        ]
    },
    "CITES": {
        "full_name": "Convention on International Trade in Endangered Species",
        "url": "https://cites.org/eng/resources/permits.php",
        "timeline": "3–5 months",
        "cost_tier": "Low (₹20,000–₹80,000)",
        "description": "Required for products derived from or containing wildlife materials",
        "steps": [
            "Determine if your product contains CITES-listed species",
            "Apply for CITES permits through your national Management Authority",
            "Ensure legal acquisition documentation for all wildlife-derived materials"
        ]
    },
    "TNFD": {
        "full_name": "Taskforce on Nature-related Financial Disclosures",
        "url": "https://tnfd.global/engage/adopt-and-report",
        "timeline": "Ongoing (reporting framework)",
        "cost_tier": "Variable — internal assessment costs",
        "description": "Nature-related risk disclosure framework for financial reporting",
        "steps": [
            "Register as a TNFD adopter",
            "Conduct LEAP (Locate, Evaluate, Assess, Prepare) nature assessment",
            "Integrate nature-related disclosures into annual reporting"
        ]
    },
    "Carbon Trust": {
        "full_name": "Carbon Trust Standard",
        "url": "https://www.carbontrust.com/our-work/certifications-and-standards",
        "timeline": "3–6 months",
        "cost_tier": "Medium (₹80,000–₹2,50,000)",
        "description": "Carbon footprint measurement and reduction certification",
        "steps": [
            "Measure your product or organisational carbon footprint",
            "Set and demonstrate year-on-year reduction targets",
            "Submit to independent verification by Carbon Trust"
        ]
    }
}


def verify_certificates(company_name: str, claimed_certs: list[str], product_category: str) -> list[dict]:
    """
    Verify each claimed certificate against the registry.
    Returns detailed verification result for each cert including scope matching.
    """
    results = []

    for cert_type in claimed_certs:
        result = _verify_single_cert(company_name, cert_type, product_category)
        results.append(result)

    # Also flag unclaimed but potentially required certs
    missing_required = _identify_missing_certs(product_category, claimed_certs)
    
    return {
        "verification_results": results,
        "missing_recommended": missing_required,
        "overall_cert_status": _overall_status(results)
    }


def _verify_single_cert(company: str, cert_type: str, category: str) -> dict:
    """Verify a single certificate claim."""
    # Find matching records
    matches = [
        r for r in REGISTRY
        if r["company"].lower() == company.lower()
        and r["cert_type"].lower() == cert_type.lower()
    ]

    if not matches:
        return {
            "cert": cert_type,
            "status": "NOT_FOUND",
            "severity": "high",
            "reason": f"No {cert_type} certificate found in registry for {company}",
            "remediation": CERT_GUIDANCE.get(cert_type, {}),
            "registry_checked": True
        }

    record = matches[0]

    # Check expiry
    expiry_date = datetime.strptime(record["expiry"], "%Y-%m-%d").date()
    today = date.today()
    is_expired = expiry_date < today
    days_until_expiry = (expiry_date - today).days

    if is_expired:
        return {
            "cert": cert_type,
            "status": "EXPIRED",
            "severity": "high",
            "reason": f"Certificate expired on {record['expiry']} ({abs(days_until_expiry)} days ago)",
            "certificate_number": record["certificate_number"],
            "remediation": {**CERT_GUIDANCE.get(cert_type, {}), "action": "Renew your existing certificate through your certifying body"},
            "registry_checked": True
        }

    # Check scope / category applicability
    if category.lower() not in [c.lower() for c in record["applicable_categories"]]:
        return {
            "cert": cert_type,
            "status": "SCOPE_MISMATCH",
            "severity": "medium",
            "reason": f"Certificate covers {', '.join(record['applicable_categories'])} — does not extend to '{category}'",
            "certificate_number": record["certificate_number"],
            "expiry": record["expiry"],
            "remediation": {
                **CERT_GUIDANCE.get(cert_type, {}),
                "action": f"Contact {record['issuing_body']} to extend scope to cover {category} products"
            },
            "registry_checked": True
        }

    # Warn if expiring soon (within 90 days)
    expiry_warning = None
    if 0 < days_until_expiry < 90:
        expiry_warning = f"Certificate expires in {days_until_expiry} days — plan renewal soon"

    return {
        "cert": cert_type,
        "status": "VERIFIED",
        "severity": "none",
        "reason": f"Valid until {record['expiry']}",
        "certificate_number": record["certificate_number"],
        "issuing_body": record["issuing_body"],
        "expiry_warning": expiry_warning,
        "registry_checked": True
    }


def _identify_missing_certs(category: str, claimed: list[str]) -> list[dict]:
    """Identify certifications that are recommended for a product category but not claimed."""
    recommendations = {
        "timber": ["FSC", "PEFC", "Carbon Trust"],
        "paper": ["FSC", "PEFC"],
        "furniture": ["FSC", "ISO 14001"],
        "textiles": ["PEFC", "ISO 14001"],
        "food": ["Rainforest Alliance"],
        "agriculture": ["Rainforest Alliance", "ISO 14001"],
        "cosmetics": ["ISO 14001"],
        "personal care": ["ISO 14001"],
        "packaging": ["FSC", "Carbon Trust"],
        "wildlife products": ["CITES"],
        "exotic materials": ["CITES"],
        "leather": ["CITES", "ISO 14001"]
    }

    recommended = recommendations.get(category.lower(), [])
    missing = [
        {"cert": c, "reason": f"Recommended for {category} products", "guidance": CERT_GUIDANCE.get(c, {})}
        for c in recommended if c not in claimed
    ]
    return missing


def _overall_status(results: list[dict]) -> str:
    """Compute overall certificate verification status."""
    if not results:
        return "NO_CERTS_CLAIMED"
    statuses = [r["status"] for r in results]
    if all(s == "VERIFIED" for s in statuses):
        return "ALL_VERIFIED"
    if any(s in ["NOT_FOUND", "EXPIRED"] for s in statuses):
        return "FAILED"
    return "PARTIAL"