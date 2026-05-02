"""
Issuer Validator - Validates certificate-issuing institutions
Uses fuzzy matching against a curated registry of universities/institutions
"""
import json
import os
from pathlib import Path
from loguru import logger

try:
    from rapidfuzz import fuzz, process
    USE_RAPIDFUZZ = True
except ImportError:
    logger.warning("rapidfuzz not available, using basic matching")
    USE_RAPIDFUZZ = False

REGISTRY_PATH = Path(__file__).parent / "data" / "issuer_registry.json"
_registry_cache = None


def load_issuer_registry() -> dict:
    """Load and cache the issuer registry"""
    global _registry_cache
    if _registry_cache is not None:
        return _registry_cache

    if REGISTRY_PATH.exists():
        with open(REGISTRY_PATH) as f:
            _registry_cache = json.load(f)
    else:
        logger.warning(f"Registry not found at {REGISTRY_PATH}, using built-in defaults")
        _registry_cache = _get_default_registry()

    logger.info(f"[Registry] Loaded {len(_registry_cache.get('institutions', []))} institutions")
    return _registry_cache


def validate_issuer(issuer_name: str) -> dict:
    """
    Validate the issuing institution against the registry.
    Returns confidence score and match details.
    """
    if not issuer_name or len(issuer_name.strip()) < 3:
        logger.debug("[Issuer] Empty issuer name")
        return {
            "issuer_valid": False,
            "issuer_confidence": 0.0,
            "matched_name": "",
            "issuer_type": "unknown",
            "matched_domain": "",
            "accredited": False
        }

    registry = load_issuer_registry()
    institutions = registry.get("institutions", [])

    if not institutions:
        return {
            "issuer_valid": False,
            "issuer_confidence": 0.0,
            "matched_name": "",
            "issuer_type": "unknown",
            "matched_domain": "",
            "accredited": False
        }

    issuer_clean = issuer_name.strip().lower()

    best_match = None
    best_score = 0

    if USE_RAPIDFUZZ:
        # Build name list for batch matching
        names = [inst["name"].lower() for inst in institutions]
        # Also check aliases
        alias_map = {}
        for inst in institutions:
            for alias in inst.get("aliases", []):
                alias_map[alias.lower()] = inst

        # Check aliases first (exact or near-exact)
        for alias_lower, inst in alias_map.items():
            score = fuzz.token_set_ratio(issuer_clean, alias_lower)
            if score > best_score:
                best_score = score
                best_match = inst

        # Main name matching
        for inst in institutions:
            score = fuzz.token_set_ratio(issuer_clean, inst["name"].lower())
            # Also try partial ratio for long names
            partial = fuzz.partial_ratio(issuer_clean, inst["name"].lower())
            combined = max(score, partial * 0.9)  # partial gets slight discount
            if combined > best_score:
                best_score = combined
                best_match = inst
    else:
        # Simple string matching fallback
        for inst in institutions:
            score = _simple_fuzzy(issuer_clean, inst["name"].lower())
            if score > best_score:
                best_score = score
                best_match = inst

    # Threshold: 75 for validity
    is_valid = best_score >= 75

    logger.info(f"[Issuer] '{issuer_name}' → '{best_match['name'] if best_match else 'No match'}' (score={best_score:.1f}, valid={is_valid})")

    return {
        "issuer_valid": is_valid,
        "issuer_confidence": min(best_score / 100.0, 1.0),
        "matched_name": best_match["name"] if best_match else "",
        "issuer_type": best_match.get("type", "unknown") if best_match else "unknown",
        "matched_domain": best_match.get("domain", "") if best_match else "",
        "accredited": best_match.get("accredited", False) if best_match else False
    }


def _simple_fuzzy(s1: str, s2: str) -> float:
    """Basic fuzzy matching without rapidfuzz"""
    if s1 == s2:
        return 100.0
    if s1 in s2 or s2 in s1:
        return 85.0
    words1 = set(s1.split())
    words2 = set(s2.split())
    if words1 & words2:
        overlap = len(words1 & words2) / max(len(words1), len(words2))
        return overlap * 80.0
    return 0.0


def _get_default_registry() -> dict:
    """Built-in registry with major Indian and global institutions"""
    return {
        "institutions": [
            # ── IITs ───────────────────────────────────────────────────────
            {"name": "Indian Institute of Technology Delhi", "aliases": ["IIT Delhi", "IITD"], "type": "university", "domain": "iitd.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology Bombay", "aliases": ["IIT Bombay", "IIT Mumbai", "IITB"], "type": "university", "domain": "iitb.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology Madras", "aliases": ["IIT Madras", "IIT Chennai", "IITM"], "type": "university", "domain": "iitm.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology Kharagpur", "aliases": ["IIT Kharagpur", "IIT KGP", "IITKGP"], "type": "university", "domain": "iitkgp.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology Kanpur", "aliases": ["IIT Kanpur", "IITK"], "type": "university", "domain": "iitk.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology Roorkee", "aliases": ["IIT Roorkee", "IITR"], "type": "university", "domain": "iitr.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology Hyderabad", "aliases": ["IIT Hyderabad", "IITH"], "type": "university", "domain": "iith.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology Guwahati", "aliases": ["IIT Guwahati", "IITG"], "type": "university", "domain": "iitg.ac.in", "accredited": True},
            # ── IIMs ───────────────────────────────────────────────────────
            {"name": "Indian Institute of Management Ahmedabad", "aliases": ["IIM Ahmedabad", "IIMA"], "type": "management", "domain": "iima.ac.in", "accredited": True},
            {"name": "Indian Institute of Management Bangalore", "aliases": ["IIM Bangalore", "IIMB"], "type": "management", "domain": "iimb.ac.in", "accredited": True},
            {"name": "Indian Institute of Management Calcutta", "aliases": ["IIM Calcutta", "IIM Kolkata", "IIMC"], "type": "management", "domain": "iimcal.ac.in", "accredited": True},
            # ── Central Universities ───────────────────────────────────────
            {"name": "Delhi University", "aliases": ["University of Delhi", "DU"], "type": "university", "domain": "du.ac.in", "accredited": True},
            {"name": "Jawaharlal Nehru University", "aliases": ["JNU", "JNU Delhi"], "type": "university", "domain": "jnu.ac.in", "accredited": True},
            {"name": "Banaras Hindu University", "aliases": ["BHU", "BHU Varanasi"], "type": "university", "domain": "bhu.ac.in", "accredited": True},
            {"name": "Hyderabad University", "aliases": ["University of Hyderabad", "UoH"], "type": "university", "domain": "uohyd.ac.in", "accredited": True},
            {"name": "Aligarh Muslim University", "aliases": ["AMU"], "type": "university", "domain": "amu.ac.in", "accredited": True},
            # ── State Universities ─────────────────────────────────────────
            {"name": "Mumbai University", "aliases": ["University of Mumbai", "Bombay University"], "type": "university", "domain": "mu.ac.in", "accredited": True},
            {"name": "Osmania University", "aliases": ["OU Hyderabad"], "type": "university", "domain": "osmania.ac.in", "accredited": True},
            {"name": "Anna University", "aliases": ["Anna University Chennai"], "type": "university", "domain": "annauniv.edu", "accredited": True},
            {"name": "Pune University", "aliases": ["University of Pune", "Savitribai Phule Pune University", "SPPU"], "type": "university", "domain": "unipune.ac.in", "accredited": True},
            {"name": "Rajasthan University", "aliases": ["University of Rajasthan"], "type": "university", "domain": "uniraj.ac.in", "accredited": True},
            # ── NITs ───────────────────────────────────────────────────────
            {"name": "National Institute of Technology Trichy", "aliases": ["NIT Trichy", "NITT"], "type": "university", "domain": "nitt.edu", "accredited": True},
            {"name": "National Institute of Technology Warangal", "aliases": ["NIT Warangal", "NITW"], "type": "university", "domain": "nitw.ac.in", "accredited": True},
            {"name": "National Institute of Technology Surathkal", "aliases": ["NIT Surathkal", "NITK"], "type": "university", "domain": "nitk.ac.in", "accredited": True},
            # ── Private Universities ───────────────────────────────────────
            {"name": "BITS Pilani", "aliases": ["Birla Institute of Technology and Science", "BITS"], "type": "university", "domain": "bits-pilani.ac.in", "accredited": True},
            {"name": "VIT University", "aliases": ["VIT Vellore", "Vellore Institute of Technology"], "type": "university", "domain": "vit.ac.in", "accredited": True},
            {"name": "Manipal Academy of Higher Education", "aliases": ["Manipal University", "MAHE"], "type": "university", "domain": "manipal.edu", "accredited": True},
            {"name": "Amity University", "aliases": [], "type": "university", "domain": "amity.edu", "accredited": True},
            {"name": "SRM Institute of Science and Technology", "aliases": ["SRM University", "SRMIST"], "type": "university", "domain": "srmist.edu.in", "accredited": True},
            # ── Online / MOOC ──────────────────────────────────────────────
            {"name": "Coursera", "aliases": [], "type": "online_platform", "domain": "coursera.org", "accredited": True},
            {"name": "edX", "aliases": [], "type": "online_platform", "domain": "edx.org", "accredited": True},
            {"name": "NPTEL", "aliases": ["National Programme on Technology Enhanced Learning"], "type": "online_platform", "domain": "nptel.ac.in", "accredited": True},
            {"name": "Udemy", "aliases": [], "type": "online_platform", "domain": "udemy.com", "accredited": False},
            {"name": "LinkedIn Learning", "aliases": ["LinkedIn"], "type": "online_platform", "domain": "linkedin.com", "accredited": False},
            # ── International ─────────────────────────────────────────────
            {"name": "Massachusetts Institute of Technology", "aliases": ["MIT"], "type": "university", "domain": "mit.edu", "accredited": True},
            {"name": "Stanford University", "aliases": ["Stanford"], "type": "university", "domain": "stanford.edu", "accredited": True},
            {"name": "Harvard University", "aliases": ["Harvard"], "type": "university", "domain": "harvard.edu", "accredited": True},
            {"name": "Oxford University", "aliases": ["University of Oxford", "Oxford"], "type": "university", "domain": "ox.ac.uk", "accredited": True},
            {"name": "Cambridge University", "aliases": ["University of Cambridge", "Cambridge"], "type": "university", "domain": "cam.ac.uk", "accredited": True},
            # ── Boards ────────────────────────────────────────────────────
            {"name": "Central Board of Secondary Education", "aliases": ["CBSE"], "type": "board", "domain": "cbse.gov.in", "accredited": True},
            {"name": "Indian Certificate of Secondary Education", "aliases": ["ICSE", "CISCE"], "type": "board", "domain": "cisce.org", "accredited": True},
            {"name": "Maharashtra State Board", "aliases": ["MSBSHSE", "Maharashtra Board"], "type": "board", "domain": "msbshse.ac.in", "accredited": True},
            # ── Professional ──────────────────────────────────────────────
            {"name": "Institute of Chartered Accountants of India", "aliases": ["ICAI"], "type": "professional", "domain": "icai.org", "accredited": True},
            {"name": "Bar Council of India", "aliases": ["BCI"], "type": "professional", "domain": "barcouncilofindia.org", "accredited": True},
            {"name": "Medical Council of India", "aliases": ["MCI", "NMC"], "type": "professional", "domain": "nmc.org.in", "accredited": True},
        ]
    }
