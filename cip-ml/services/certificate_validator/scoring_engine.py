"""
Scoring Engine - Computes final authenticity score with explainable reasons
Formula: 0.30*OCR + 0.25*Issuer + 0.20*ID + 0.25*(1-Tampering)
"""
from loguru import logger


def compute_authenticity_score(
    ocr_result: dict,
    issuer_result: dict,
    id_result: dict,
    tamper_result: dict
) -> dict:
    """
    Compute weighted authenticity score.
    All inputs are expected to have confidence/score values in [0, 1].
    Returns score (0-100), status, confidence, reasons, warnings.
    """

    # ── Component Scores ────────────────────────────────────────────────────

    # OCR score: based on extraction confidence + completeness of fields
    ocr_conf = float(ocr_result.get("ocr_confidence", 0.0))
    ocr_completeness = _ocr_completeness(ocr_result)
    ocr_score = (ocr_conf * 0.6 + ocr_completeness * 0.4)
    ocr_score = max(0.0, min(ocr_score, 1.0))

    # Issuer score: direct confidence from validator
    issuer_score = float(issuer_result.get("issuer_confidence", 0.0))

    # ID score: from ID validator
    id_score = float(id_result.get("id_score", 0.5))

    # Tamper score: inverted (high tampering = low score)
    tampering_score = float(tamper_result.get("tampering_score", 0.0))
    anti_tamper_score = 1.0 - tampering_score
    anti_tamper_score = max(0.0, min(anti_tamper_score, 1.0))

    # ── Weighted Final Score ────────────────────────────────────────────────
    W_OCR = 0.30
    W_ISSUER = 0.25
    W_ID = 0.20
    W_TAMPER = 0.25

    raw_score = (
        W_OCR * ocr_score +
        W_ISSUER * issuer_score +
        W_ID * id_score +
        W_TAMPER * anti_tamper_score
    )

    # Apply penalty if tampering strongly detected
    if tamper_result.get("tampering_detected") and tampering_score > 0.65:
        raw_score *= 0.75  # Significant penalty
        logger.info(f"[Score] Applied tampering penalty (score={tampering_score:.2f})")

    final_score = int(round(raw_score * 100))
    final_score = max(0, min(final_score, 100))

    # ── Status Classification ───────────────────────────────────────────────
    if final_score >= 85:
        status = "Genuine"
    elif final_score >= 70:
        status = "Likely Genuine"
    elif final_score >= 50:
        status = "Suspicious"
    elif final_score >= 30:
        status = "Likely Fake"
    else:
        status = "Fake"

    # ── Confidence Level ────────────────────────────────────────────────────
    # High confidence when score is far from the boundary thresholds
    boundary_distances = [
        abs(final_score - 85),
        abs(final_score - 70),
        abs(final_score - 50),
        abs(final_score - 30),
    ]
    min_distance = min(boundary_distances)

    if min_distance >= 15:
        confidence = "High"
    elif min_distance >= 8:
        confidence = "Medium"
    else:
        confidence = "Low"

    # ── Explainable Reasons ─────────────────────────────────────────────────
    reasons = []
    warnings = []

    # Positive reasons
    if ocr_conf >= 0.9:
        reasons.append("High OCR confidence — text is clearly readable")
    elif ocr_conf >= 0.75:
        reasons.append("Good OCR confidence")

    if ocr_completeness >= 0.8:
        reasons.append("All key fields extracted successfully (name, issuer, date, ID)")
    elif ocr_completeness >= 0.6:
        reasons.append("Most key fields present")

    if issuer_result.get("issuer_valid"):
        matched = issuer_result.get("matched_name", "")
        inst_type = issuer_result.get("issuer_type", "")
        if matched:
            reasons.append(f"Issuer verified: '{matched}' is a recognized {inst_type}")
        else:
            reasons.append("Issuer is a recognized institution")

    if issuer_result.get("accredited"):
        reasons.append("Institution is accredited")

    if id_result.get("id_valid"):
        if id_result.get("cert_id_valid"):
            reasons.append("Certificate ID format matches institution's pattern")
        if id_result.get("qr_valid"):
            reasons.append("QR code verified and links to trusted source")

    if not tamper_result.get("tampering_detected"):
        reasons.append("No signs of digital tampering detected")
    elif tampering_score < 0.3:
        reasons.append("Low tampering indicators")

    if ocr_result.get("signatories"):
        reasons.append(f"Signatory information found")

    # Negative reasons / warnings
    if ocr_conf < 0.5:
        warnings.append(f"Low OCR confidence ({ocr_conf:.0%}) — document may be low quality or handwritten")

    if not ocr_result.get("issuer"):
        warnings.append("Issuer name could not be extracted")

    if not issuer_result.get("issuer_valid"):
        conf = issuer_result.get("issuer_confidence", 0.0)
        if conf > 0.5:
            warnings.append(f"Issuer partially matches registry (confidence: {conf:.0%})")
        else:
            warnings.append("Issuer not found in recognized institution registry")

    if not ocr_result.get("certificate_id") and not ocr_result.get("qr_code_data"):
        warnings.append("No certificate ID or QR code found — harder to independently verify")

    if not ocr_result.get("issue_date"):
        warnings.append("Issue date not found")

    for issue in tamper_result.get("issues", []):
        warnings.append(f"Forensic alert: {issue}")

    if ocr_completeness < 0.4:
        warnings.append("Several key fields are missing from the certificate")

    logger.info(
        f"[Score] final={final_score}, status={status}, conf={confidence}, "
        f"ocr={ocr_score:.2f}, issuer={issuer_score:.2f}, id={id_score:.2f}, tamper={anti_tamper_score:.2f}"
    )

    return {
        "score": final_score,
        "status": status,
        "confidence": confidence,
        "reasons": reasons,
        "warnings": warnings,
        "component_scores": {
            "ocr": round(ocr_score, 3),
            "issuer": round(issuer_score, 3),
            "id": round(id_score, 3),
            "anti_tamper": round(anti_tamper_score, 3)
        }
    }


def _ocr_completeness(ocr_result: dict) -> float:
    """Score how complete the extracted data is (0-1)"""
    fields = {
        "name": 0.25,
        "issuer": 0.25,
        "issue_date": 0.15,
        "certificate_title": 0.15,
        "certificate_id": 0.20
    }

    score = 0.0
    for field, weight in fields.items():
        if ocr_result.get(field) and str(ocr_result[field]).strip():
            score += weight

    return score
