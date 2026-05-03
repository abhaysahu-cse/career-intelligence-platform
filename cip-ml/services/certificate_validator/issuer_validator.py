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
            {"name": "Indian Institute of Technology Indore", "aliases": ["IIT Indore", "IITI"], "type": "university", "domain": "iiti.ac.in", "accredited": True},
            {"name": "Indian Institute of Technology BHU", "aliases": ["IIT BHU", "IIT Varanasi"], "type": "university", "domain": "iitbhu.ac.in", "accredited": True},
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
            {"name": "Jamia Millia Islamia", "aliases": ["JMI", "Jamia"], "type": "university", "domain": "jmi.ac.in", "accredited": True},
            # ── State / Technical Universities ──────────────────────────────
            {"name": "Mumbai University", "aliases": ["University of Mumbai", "Bombay University"], "type": "university", "domain": "mu.ac.in", "accredited": True},
            {"name": "Osmania University", "aliases": ["OU Hyderabad"], "type": "university", "domain": "osmania.ac.in", "accredited": True},
            {"name": "Anna University", "aliases": ["Anna University Chennai"], "type": "university", "domain": "annauniv.edu", "accredited": True},
            {"name": "Pune University", "aliases": ["University of Pune", "Savitribai Phule Pune University", "SPPU"], "type": "university", "domain": "unipune.ac.in", "accredited": True},
            {"name": "Rajasthan University", "aliases": ["University of Rajasthan"], "type": "university", "domain": "uniraj.ac.in", "accredited": True},
            {"name": "Rajiv Gandhi Proudyogiki Vishwavidyalaya", "aliases": ["RGPV", "RGPV Bhopal", "Rajiv Gandhi Technological University"], "type": "university", "domain": "rgpv.ac.in", "accredited": True},
            {"name": "Abdul Kalam Technical University", "aliases": ["AKTU", "UPTU", "Dr. APJ Abdul Kalam Technical University"], "type": "university", "domain": "aktu.ac.in", "accredited": True},
            {"name": "Gujarat Technological University", "aliases": ["GTU"], "type": "university", "domain": "gtu.ac.in", "accredited": True},
            {"name": "Visvesvaraya Technological University", "aliases": ["VTU"], "type": "university", "domain": "vtu.ac.in", "accredited": True},
            {"name": "Jawaharlal Nehru Technological University Hyderabad", "aliases": ["JNTUH", "JNTU Hyderabad"], "type": "university", "domain": "jntuh.ac.in", "accredited": True},
            {"name": "Maulana Abul Kalam Azad University of Technology", "aliases": ["MAKAUT", "WBUT"], "type": "university", "domain": "makaut.com", "accredited": True},
            {"name": "Cochin University of Science and Technology", "aliases": ["CUSAT"], "type": "university", "domain": "cusat.ac.in", "accredited": True},
            {"name": "Panjab University", "aliases": ["PU Chandigarh"], "type": "university", "domain": "puchd.ac.in", "accredited": True},
            {"name": "Calcutta University", "aliases": ["University of Calcutta", "CU Kolkata"], "type": "university", "domain": "caluniv.ac.in", "accredited": True},
            {"name": "Madras University", "aliases": ["University of Madras"], "type": "university", "domain": "unom.ac.in", "accredited": True},
            {"name": "Bangalore University", "aliases": ["BU Bangalore"], "type": "university", "domain": "bangaloreuniversity.ac.in", "accredited": True},
            {"name": "Barkatullah University", "aliases": ["BU Bhopal"], "type": "university", "domain": "bubhopal.ac.in", "accredited": True},
            {"name": "Lucknow University", "aliases": ["University of Lucknow"], "type": "university", "domain": "lkouniv.ac.in", "accredited": True},
            # ── NITs ───────────────────────────────────────────────────────
            {"name": "National Institute of Technology Trichy", "aliases": ["NIT Trichy", "NITT"], "type": "university", "domain": "nitt.edu", "accredited": True},
            {"name": "National Institute of Technology Warangal", "aliases": ["NIT Warangal", "NITW"], "type": "university", "domain": "nitw.ac.in", "accredited": True},
            {"name": "National Institute of Technology Surathkal", "aliases": ["NIT Surathkal", "NITK"], "type": "university", "domain": "nitk.ac.in", "accredited": True},
            {"name": "National Institute of Technology Calicut", "aliases": ["NIT Calicut", "NITC"], "type": "university", "domain": "nitc.ac.in", "accredited": True},
            {"name": "National Institute of Technology Rourkela", "aliases": ["NIT Rourkela", "NITR"], "type": "university", "domain": "nitrkl.ac.in", "accredited": True},
            {"name": "National Institute of Technology Allahabad", "aliases": ["NIT Allahabad", "MNNIT"], "type": "university", "domain": "mnnit.ac.in", "accredited": True},
            {"name": "National Institute of Technology Bhopal", "aliases": ["NIT Bhopal", "MANIT"], "type": "university", "domain": "manit.ac.in", "accredited": True},
            # ── Private Universities ───────────────────────────────────────
            {"name": "BITS Pilani", "aliases": ["Birla Institute of Technology and Science", "BITS"], "type": "university", "domain": "bits-pilani.ac.in", "accredited": True},
            {"name": "VIT University", "aliases": ["VIT Vellore", "Vellore Institute of Technology"], "type": "university", "domain": "vit.ac.in", "accredited": True},
            {"name": "Manipal Academy of Higher Education", "aliases": ["Manipal University", "MAHE"], "type": "university", "domain": "manipal.edu", "accredited": True},
            {"name": "Amity University", "aliases": [], "type": "university", "domain": "amity.edu", "accredited": True},
            {"name": "SRM Institute of Science and Technology", "aliases": ["SRM University", "SRMIST"], "type": "university", "domain": "srmist.edu.in", "accredited": True},
            {"name": "Lovely Professional University", "aliases": ["LPU"], "type": "university", "domain": "lpu.in", "accredited": True},
            {"name": "Chandigarh University", "aliases": ["CU Mohali"], "type": "university", "domain": "cuchd.in", "accredited": True},
            {"name": "Shiv Nadar University", "aliases": ["SNU"], "type": "university", "domain": "snu.edu.in", "accredited": True},
            {"name": "IIIT Hyderabad", "aliases": ["International Institute of Information Technology Hyderabad"], "type": "university", "domain": "iiit.ac.in", "accredited": True},
            {"name": "IIIT Delhi", "aliases": ["Indraprastha Institute of Information Technology Delhi"], "type": "university", "domain": "iiitd.ac.in", "accredited": True},
            # ── Online / MOOC ──────────────────────────────────────────────
            {"name": "Coursera", "aliases": [], "type": "online_platform", "domain": "coursera.org", "accredited": True},
            {"name": "edX", "aliases": [], "type": "online_platform", "domain": "edx.org", "accredited": True},
            {"name": "NPTEL", "aliases": ["National Programme on Technology Enhanced Learning"], "type": "online_platform", "domain": "nptel.ac.in", "accredited": True},
            {"name": "Udemy", "aliases": [], "type": "online_platform", "domain": "udemy.com", "accredited": False},
            {"name": "LinkedIn Learning", "aliases": ["LinkedIn"], "type": "online_platform", "domain": "linkedin.com", "accredited": False},
            {"name": "Udacity", "aliases": [], "type": "online_platform", "domain": "udacity.com", "accredited": False},
            {"name": "Great Learning", "aliases": [], "type": "online_platform", "domain": "greatlearning.in", "accredited": False},
            {"name": "Simplilearn", "aliases": [], "type": "online_platform", "domain": "simplilearn.com", "accredited": False},
            # ── Tech Certifications ──────────────────────────────────────
            {"name": "Amazon Web Services", "aliases": ["AWS", "AWS Training", "AWS Certification"], "type": "tech_certification", "domain": "aws.amazon.com", "accredited": True},
            {"name": "Google Cloud", "aliases": ["Google Cloud Platform", "GCP", "Google Cloud Certification"], "type": "tech_certification", "domain": "cloud.google.com", "accredited": True},
            {"name": "Google", "aliases": ["Google Career Certificates", "Google Professional Certificate"], "type": "tech_certification", "domain": "google.com", "accredited": True},
            {"name": "Microsoft", "aliases": ["Microsoft Azure", "Azure Certification", "Microsoft Certified"], "type": "tech_certification", "domain": "microsoft.com", "accredited": True},
            {"name": "Oracle", "aliases": ["Oracle University", "Oracle Certified"], "type": "tech_certification", "domain": "oracle.com", "accredited": True},
            {"name": "Cisco", "aliases": ["Cisco Networking Academy", "CCNA", "CCNP"], "type": "tech_certification", "domain": "cisco.com", "accredited": True},
            {"name": "Meta", "aliases": ["Meta Certification", "Facebook"], "type": "tech_certification", "domain": "meta.com", "accredited": True},
            {"name": "IBM", "aliases": ["IBM Skills", "IBM Professional Certificate"], "type": "tech_certification", "domain": "ibm.com", "accredited": True},
            {"name": "Salesforce", "aliases": ["Salesforce Certification", "Salesforce Trailhead"], "type": "tech_certification", "domain": "salesforce.com", "accredited": True},
            {"name": "HackerRank", "aliases": [], "type": "tech_certification", "domain": "hackerrank.com", "accredited": False},
            # ── International ─────────────────────────────────────────────
            {"name": "Massachusetts Institute of Technology", "aliases": ["MIT"], "type": "university", "domain": "mit.edu", "accredited": True},
            {"name": "Stanford University", "aliases": ["Stanford"], "type": "university", "domain": "stanford.edu", "accredited": True},
            {"name": "Harvard University", "aliases": ["Harvard"], "type": "university", "domain": "harvard.edu", "accredited": True},
            {"name": "Oxford University", "aliases": ["University of Oxford", "Oxford"], "type": "university", "domain": "ox.ac.uk", "accredited": True},
            {"name": "Cambridge University", "aliases": ["University of Cambridge", "Cambridge"], "type": "university", "domain": "cam.ac.uk", "accredited": True},
            {"name": "Carnegie Mellon University", "aliases": ["CMU"], "type": "university", "domain": "cmu.edu", "accredited": True},
            {"name": "University of California Berkeley", "aliases": ["UC Berkeley", "Berkeley"], "type": "university", "domain": "berkeley.edu", "accredited": True},
            # ── Boards ────────────────────────────────────────────────────
            {"name": "Central Board of Secondary Education", "aliases": ["CBSE"], "type": "board", "domain": "cbse.gov.in", "accredited": True},
            {"name": "Indian Certificate of Secondary Education", "aliases": ["ICSE", "CISCE"], "type": "board", "domain": "cisce.org", "accredited": True},
            {"name": "Maharashtra State Board", "aliases": ["MSBSHSE", "Maharashtra Board"], "type": "board", "domain": "msbshse.ac.in", "accredited": True},
            {"name": "Madhya Pradesh Board", "aliases": ["MPBSE", "MP Board"], "type": "board", "domain": "mpbse.nic.in", "accredited": True},
            {"name": "Uttar Pradesh Board", "aliases": ["UP Board"], "type": "board", "domain": "upmsp.edu.in", "accredited": True},
            # ── Professional ──────────────────────────────────────────────
            {"name": "Institute of Chartered Accountants of India", "aliases": ["ICAI"], "type": "professional", "domain": "icai.org", "accredited": True},
            {"name": "Bar Council of India", "aliases": ["BCI"], "type": "professional", "domain": "barcouncilofindia.org", "accredited": True},
            {"name": "Medical Council of India", "aliases": ["MCI", "NMC"], "type": "professional", "domain": "nmc.org.in", "accredited": True},
        ]
    }
