"""
nlp_engine.py
NLP claim extraction and classification engine.
Uses keyword matching + zero-shot classification for MVP.
Fine-tuned BERT can replace this in production.
"""

import json
import re
import os
from pathlib import Path

# Load keyword taxonomy
DATA_DIR = Path(__file__).parent.parent / "data"

with open(DATA_DIR / "greenwashing_keywords.json") as f:
    KEYWORDS = json.load(f)

# Linguistic red flags — documented greenwashing tactics
LINGUISTIC_RED_FLAGS = [
    r"\b(our commitment to|we are committed to|we strive to|we aim to)\b",  # vague pledges
    r"\b(up to|as much as|can be|may be)\b",                                 # hedging
    r"\b(greener|more sustainable|better for|cleaner than)\b",               # unqualified comparatives
    r"\b(designed with|made with|crafted with|inspired by) nature\b",        # nature-washing
    r"\b(responsibly|thoughtfully|carefully) (made|sourced|crafted)\b",      # adverb washing
]

# Claim type weights for scoring
CLAIM_TYPE_WEIGHTS = {
    "absolute": 40,
    "misleading": 30,
    "vague": 15
}


def extract_claims(text: str) -> list[dict]:
    """
    Extract and classify environmental claims from product text.
    Returns list of detected claims with type, confidence, and position.
    """
    text_lower = text.lower()
    detected = []
    seen_phrases = set()

    # 1. Keyword-based extraction
    for claim_type, phrases in KEYWORDS.items():
        for phrase in phrases:
            if phrase.lower() in text_lower and phrase not in seen_phrases:
                seen_phrases.add(phrase)

                # Find position in original text
                start_idx = text_lower.find(phrase.lower())

                # Calculate base confidence based on claim type
                base_confidence = {
                    "absolute": 0.92,
                    "misleading": 0.85,
                    "vague": 0.78
                }.get(claim_type, 0.75)

                # Boost confidence if phrase is in title position (first 50 chars)
                position_boost = 0.05 if start_idx < 50 else 0.0

                detected.append({
                    "phrase": phrase,
                    "type": claim_type,
                    "confidence": round(min(base_confidence + position_boost, 0.99), 2),
                    "position": start_idx,
                    "context": _extract_context(text, start_idx, len(phrase))
                })

    # 2. Linguistic red flag detection
    red_flags = _detect_red_flags(text)

    # 3. Check for missing proof markers
    has_proof = _has_proof_markers(text_lower)

    return {
        "claims": detected,
        "red_flags": red_flags,
        "has_proof_markers": has_proof,
        "claim_count": len(detected),
        "is_ai_generated_risk": _assess_ai_generated_risk(text)
    }


def _extract_context(text: str, start: int, length: int, window: int = 40) -> str:
    """Extract surrounding context for a detected claim phrase."""
    ctx_start = max(0, start - window)
    ctx_end = min(len(text), start + length + window)
    snippet = text[ctx_start:ctx_end]
    return f"...{snippet}..." if ctx_start > 0 else f"{snippet}..."


def _detect_red_flags(text: str) -> list[dict]:
    """Detect linguistic patterns associated with greenwashing tactics."""
    flags = []
    text_lower = text.lower()

    flag_descriptions = {
        r"\b(our commitment to|we are committed to|we strive to|we aim to)\b": "Vague pledge without measurable target",
        r"\b(up to|as much as|can be|may be)\b": "Hedging language undermining claim strength",
        r"\b(greener|more sustainable|better for|cleaner than)\b": "Unqualified comparative — no reference point given",
        r"\b(designed with|made with|crafted with|inspired by) nature\b": "Nature-association language without substance",
        r"\b(responsibly|thoughtfully|carefully) (made|sourced|crafted)\b": "Adverb-washing — adverb not backed by standard",
    }

    for pattern, description in flag_descriptions.items():
        match = re.search(pattern, text_lower)
        if match:
            flags.append({
                "pattern": match.group(),
                "description": description,
                "position": match.start()
            })

    return flags


def _has_proof_markers(text_lower: str) -> bool:
    """Check if text contains any verifiable proof markers."""
    proof_markers = [
        "certificate", "certified", "certification", "verified by",
        "audited by", "third-party", "third party", "iso ", "fsc",
        "pefc", "rainforest alliance", "carbon trust", "cites",
        "registration number", "cert no", "license no"
    ]
    return any(marker in text_lower for marker in proof_markers)


def _assess_ai_generated_risk(text: str) -> dict:
    """
    Heuristic assessment of whether text may be AI-generated greenwashing.
    Checks for statistical patterns: unusual polish, keyword density, structure.
    """
    words = text.split()
    if not words:
        return {"risk": "low", "score": 0, "indicators": []}

    indicators = []
    score = 0

    # Check keyword density — AI tends to over-optimize
    green_word_count = sum(1 for w in words if w.lower() in [
        "sustainable", "eco", "green", "natural", "organic",
        "biodegradable", "renewable", "ethical", "responsible", "conscious"
    ])
    density = green_word_count / len(words)
    if density > 0.08:
        score += 30
        indicators.append(f"High green keyword density ({density:.1%})")

    # Check for suspiciously perfect sentence structure
    sentences = text.split(".")
    avg_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    if 15 < avg_len < 22:  # AI tends to produce uniform sentence lengths
        score += 20
        indicators.append("Unusually uniform sentence length pattern")

    # Check for absence of specific numbers/data (AI often avoids specifics)
    has_numbers = bool(re.search(r'\d+%|\d+\s*(kg|tonnes|hectares|km)', text))
    if not has_numbers and len(words) > 30:
        score += 25
        indicators.append("No specific measurements or data points found")

    risk_level = "high" if score >= 50 else "medium" if score >= 25 else "low"
    return {"risk": risk_level, "score": score, "indicators": indicators}