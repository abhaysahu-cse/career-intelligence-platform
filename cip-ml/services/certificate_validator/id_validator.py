"""
Certificate ID & QR Validator
Validates certificate ID patterns and decodes/verifies QR codes
"""
import re
from loguru import logger


# Known certificate ID patterns by institution type
ID_PATTERNS = {
    "iit": [
        r"^[A-Z]{2,4}[-\/]?\d{4}[-\/]?\d{4,8}$",
        r"^\d{8,12}$",
    ],
    "university": [
        r"^[A-Z]{1,4}\d{6,12}$",
        r"^\d{4}[-\/]?\d{4,8}$",
        r"^[A-Z]{2,6}[-\/]\d{4}[-\/]\d{4,8}$",
    ],
    "online_platform": [
        r"^[A-Z0-9]{8,32}$",  # Coursera/edX style
        r"^UC-[a-f0-9\-]{30,40}$",  # Udemy
        r"^[a-f0-9]{32,64}$",  # Hash-based IDs
    ],
    "board": [
        r"^\d{7,12}$",
        r"^[A-Z]{1,3}\d{6,10}$",
    ],
    "generic": [
        r"^[A-Z0-9\-\/]{4,30}$",
    ]
}

# Known QR code domains for trusted issuers
TRUSTED_DOMAINS = [
    "coursera.org", "edx.org", "udemy.com", "linkedin.com",
    "iitd.ac.in", "iitb.ac.in", "iitm.ac.in", "iitk.ac.in",
    "du.ac.in", "mu.ac.in", "nptel.ac.in",
    "cbse.gov.in", "icai.org",
    "mit.edu", "stanford.edu", "harvard.edu",
    "credential.net", "credly.com", "badgr.com",
    "verify.credential", "certificates.google.com"
]


def validate_certificate_id(cert_id: str, qr_data: str, issuer_domain: str = "") -> dict:
    """
    Validate certificate ID format and QR code data.
    Returns score and notes.
    """
    notes = []
    id_score = 0.5  # Neutral default

    # ── ID Format Validation ────────────────────────────────────────────────
    id_valid = False
    if cert_id:
        cert_id_clean = cert_id.strip().upper()

        # Try institution-specific patterns first
        institution_type = _guess_institution_type(issuer_domain)
        patterns_to_try = ID_PATTERNS.get(institution_type, []) + ID_PATTERNS["generic"]

        for pattern in patterns_to_try:
            if re.match(pattern, cert_id_clean):
                id_valid = True
                id_score = 0.85
                notes.append(f"Certificate ID matches expected format")
                break

        if not id_valid and len(cert_id_clean) >= 4:
            # Partial credit: has an ID even if format is unusual
            id_score = 0.6
            notes.append("Certificate ID present but format is non-standard")

        if not cert_id:
            id_score = 0.3
            notes.append("No certificate ID found — harder to verify")

    # ── QR Code Validation ──────────────────────────────────────────────────
    qr_valid = False
    if qr_data:
        qr_result = _validate_qr(qr_data)
        qr_valid = qr_result["valid"]
        notes.extend(qr_result["notes"])

        if qr_valid:
            id_score = min(id_score + 0.15, 1.0)  # Bonus for valid QR
        else:
            id_score = max(id_score - 0.1, 0.0)
    else:
        notes.append("No QR code detected")

    logger.info(f"[ID] cert_id='{cert_id}', qr={'present' if qr_data else 'absent'}, score={id_score:.2f}, valid={id_valid or qr_valid}")

    return {
        "id_valid": id_valid or qr_valid,
        "id_score": round(id_score, 3),
        "cert_id_valid": id_valid,
        "qr_valid": qr_valid,
        "id_notes": notes
    }


def _validate_qr(qr_data: str) -> dict:
    """Validate QR code content"""
    notes = []
    valid = False

    # Check if it's a URL
    url_match = re.match(r"https?://([^/\s]+)", qr_data)
    if url_match:
        domain = url_match.group(1).lower()
        # Remove www prefix
        domain = re.sub(r"^www\.", "", domain)

        # Check against trusted domains
        for trusted in TRUSTED_DOMAINS:
            if domain == trusted or domain.endswith("." + trusted):
                valid = True
                notes.append(f"QR code links to trusted verification URL")
                break

        if not valid:
            notes.append(f"QR code URL domain not in trusted list: {domain}")
            # Still partially valid — has a verification URL
            valid = False
    elif len(qr_data) > 8:
        # Non-URL QR data (could be certificate number, hash, etc.)
        notes.append("QR code contains non-URL data (may be certificate number)")
        valid = True  # Give benefit of doubt

    return {"valid": valid, "notes": notes}


def _guess_institution_type(domain: str) -> str:
    """Guess institution type from domain"""
    if not domain:
        return "generic"
    domain = domain.lower()
    if any(x in domain for x in ["iit", "iim", "nit", "bits"]):
        return "iit"
    if any(x in domain for x in ["coursera", "edx", "udemy", "linkedin", "nptel"]):
        return "online_platform"
    if any(x in domain for x in ["cbse", "cisce", "board"]):
        return "board"
    if any(x in domain for x in ["university", "college", "institute", "ac.in", "edu"]):
        return "university"
    return "generic"
