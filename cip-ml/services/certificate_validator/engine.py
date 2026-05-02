"""
Certificate Validation Pipeline - Main Orchestrator
Coordinates OCR, issuer validation, tampering detection, and scoring
"""
import time
from loguru import logger

from .ocr_engine import extract_data_from_image
from .issuer_validator import validate_issuer
from .tamper_detector import detect_tampering
from .scoring_engine import compute_authenticity_score
from .id_validator import validate_certificate_id


def validate_certificate_pipeline(file_path: str, certificate_id: str) -> dict:
    """
    Full validation pipeline: OCR → Issuer → ID → Tampering → Score
    Returns comprehensive result dict.
    """
    start_time = time.time()
    logger.info(f"[PIPELINE] Starting validation: {certificate_id}")

    errors = []
    warnings = []

    # ── Step 1: OCR Extraction ──────────────────────────────────────────────
    logger.info(f"[STEP 1] OCR extraction")
    try:
        ocr_result = extract_data_from_image(file_path)
        logger.info(f"[STEP 1] OCR done — confidence={ocr_result.get('ocr_confidence', 0):.2f}")
    except Exception as e:
        logger.error(f"[STEP 1] OCR failed: {e}")
        ocr_result = _empty_ocr_result()
        errors.append(f"OCR failed: {str(e)}")

    # ── Step 2: Issuer Validation ───────────────────────────────────────────
    logger.info(f"[STEP 2] Issuer validation — issuer='{ocr_result.get('issuer', '')}'")
    try:
        issuer_result = validate_issuer(ocr_result.get("issuer", ""))
        logger.info(f"[STEP 2] Issuer — valid={issuer_result['issuer_valid']}, conf={issuer_result['issuer_confidence']:.2f}")
    except Exception as e:
        logger.error(f"[STEP 2] Issuer validation failed: {e}")
        issuer_result = _empty_issuer_result()
        errors.append(f"Issuer validation failed: {str(e)}")

    # ── Step 3: Certificate ID / QR Validation ──────────────────────────────
    logger.info(f"[STEP 3] ID/QR validation")
    try:
        id_result = validate_certificate_id(
            ocr_result.get("certificate_id", ""),
            ocr_result.get("qr_code_data", ""),
            issuer_result.get("matched_domain", "")
        )
        logger.info(f"[STEP 3] ID — valid={id_result['id_valid']}, score={id_result['id_score']:.2f}")
    except Exception as e:
        logger.error(f"[STEP 3] ID validation failed: {e}")
        id_result = {"id_valid": False, "id_score": 0.5, "id_notes": []}
        errors.append(f"ID validation failed: {str(e)}")

    # ── Step 4: Tampering Detection ─────────────────────────────────────────
    logger.info(f"[STEP 4] Tampering detection")
    try:
        tamper_result = detect_tampering(file_path)
        logger.info(f"[STEP 4] Tampering — detected={tamper_result['tampering_detected']}, score={tamper_result['tampering_score']:.2f}")
    except Exception as e:
        logger.error(f"[STEP 4] Tampering detection failed: {e}")
        tamper_result = _empty_tamper_result()
        errors.append(f"Tampering detection failed: {str(e)}")

    # ── Step 5: Final Scoring ───────────────────────────────────────────────
    logger.info(f"[STEP 5] Computing authenticity score")
    try:
        final_score = compute_authenticity_score(ocr_result, issuer_result, id_result, tamper_result)
    except Exception as e:
        logger.error(f"[STEP 5] Scoring failed: {e}")
        final_score = {"score": 0, "status": "Error", "confidence": "Low", "reasons": [], "warnings": []}
        errors.append(f"Scoring failed: {str(e)}")

    processing_time_ms = int((time.time() - start_time) * 1000)
    logger.info(f"[PIPELINE] Complete in {processing_time_ms}ms — score={final_score['score']}, status={final_score['status']}")

    return {
        "certificate_id": certificate_id,
        "authenticity_score": final_score["score"],
        "status": final_score["status"],
        "confidence_level": final_score["confidence"],
        "extracted_data": ocr_result,
        "issuer_validation": issuer_result,
        "id_validation": id_result,
        "tampering_result": tamper_result,
        "reasons": final_score["reasons"],
        "warnings": final_score["warnings"] + errors,
        "processing_time_ms": processing_time_ms
    }


# ── Fallback empty results ──────────────────────────────────────────────────

def _empty_ocr_result():
    return {
        "name": "", "issuer": "", "certificate_title": "",
        "issue_date": "", "certificate_id": "", "registration_number": "",
        "signatories": [], "qr_code_data": "", "ocr_confidence": 0.0
    }

def _empty_issuer_result():
    return {
        "issuer_valid": False, "issuer_confidence": 0.0,
        "matched_name": "", "issuer_type": "unknown", "matched_domain": ""
    }

def _empty_tamper_result():
    return {
        "tampering_detected": False, "tampering_score": 0.0, "issues": []
    }
