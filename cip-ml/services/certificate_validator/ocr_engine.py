"""
OCR Engine - Extracts structured data from certificate images/PDFs
Primary: PaddleOCR | Fallback: Tesseract
"""
import re
import os
import cv2
import numpy as np
from pathlib import Path
from loguru import logger

# Optional imports with graceful fallback
try:
    from paddleocr import PaddleOCR
    _paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
    USE_PADDLE = True
    logger.info("PaddleOCR initialized successfully")
except Exception as e:
    logger.warning(f"PaddleOCR not available: {e}. Falling back to Tesseract.")
    USE_PADDLE = False

try:
    import pytesseract
    USE_TESSERACT = True
except ImportError:
    USE_TESSERACT = False
    logger.warning("Tesseract not available")

try:
    from pdf2image import convert_from_path
    USE_PDF2IMAGE = True
except ImportError:
    USE_PDF2IMAGE = False

try:
    from pyzbar import pyzbar
    USE_PYZBAR = True
except ImportError:
    USE_PYZBAR = False


def extract_data_from_image(file_path: str) -> dict:
    """
    Main extraction function. Handles PDF and images.
    Returns structured certificate data dict.
    """
    file_path = str(file_path)
    ext = Path(file_path).suffix.lower()

    logger.info(f"[OCR] Processing file: {file_path} ({ext})")

    # PDF → image conversion
    if ext == ".pdf":
        img = _pdf_to_image(file_path)
    else:
        img = cv2.imread(file_path)

    if img is None:
        logger.error(f"[OCR] Failed to load image from: {file_path}")
        raise ValueError(f"Cannot load image from {file_path}")

    # QR/Barcode detection (before preprocessing changes the image)
    qr_data = _extract_qr_data(img.copy())

    # Preprocess
    processed = preprocess_image(img)

    # Run OCR
    text_lines, confidence = _run_ocr(processed)
    full_text = " ".join(text_lines)

    logger.info(f"[OCR] Extracted {len(text_lines)} lines, confidence={confidence:.2f}")
    logger.debug(f"[OCR] Full text (first 300 chars): {full_text[:300]}")

    result = {
        "name": extract_name(full_text),
        "issuer": extract_issuer(full_text),
        "certificate_title": extract_title(full_text),
        "issue_date": extract_date(full_text),
        "certificate_id": extract_certificate_id(full_text),
        "registration_number": extract_registration(full_text),
        "signatories": extract_signatories(full_text),
        "qr_code_data": qr_data,
        "ocr_confidence": confidence,
        "raw_text": full_text[:2000]  # Store first 2000 chars for debugging
    }

    logger.info(f"[OCR] Extracted: name='{result['name']}', issuer='{result['issuer']}', date='{result['issue_date']}'")
    return result


# ── Preprocessing ───────────────────────────────────────────────────────────

def preprocess_image(img: np.ndarray) -> np.ndarray:
    """
    Image preprocessing pipeline:
    1. Convert to grayscale
    2. Denoise
    3. Deskew
    4. Binarize (adaptive threshold)
    5. Upscale if needed
    """
    # Convert to grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    # Upscale small images for better OCR
    h, w = gray.shape
    if h < 1000 or w < 1000:
        scale = max(1000 / h, 1000 / w)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # Deskew
    deskewed = _deskew(denoised)

    # Adaptive threshold (handles uneven lighting)
    binary = cv2.adaptiveThreshold(
        deskewed, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )

    return binary


def _deskew(img: np.ndarray) -> np.ndarray:
    """Correct skew in scanned documents"""
    try:
        coords = np.column_stack(np.where(img > 0))
        if len(coords) < 10:
            return img
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) < 0.5:
            return img
        (h, w) = img.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated
    except Exception:
        return img


def _pdf_to_image(pdf_path: str) -> np.ndarray:
    """Convert first page of PDF to OpenCV image"""
    if USE_PDF2IMAGE:
        pages = convert_from_path(pdf_path, dpi=200, first_page=1, last_page=1)
        if pages:
            pil_img = pages[0]
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            return img
    # Fallback: try to read directly (some PDFs are image-based)
    img = cv2.imread(pdf_path)
    return img


# ── OCR Runners ─────────────────────────────────────────────────────────────

def _run_ocr(img: np.ndarray) -> tuple[list, float]:
    """Run OCR on processed image. Returns (text_lines, confidence)."""
    if USE_PADDLE:
        return _run_paddle(img)
    elif USE_TESSERACT:
        return _run_tesseract(img)
    else:
        logger.error("[OCR] No OCR engine available!")
        return [], 0.0


def _run_paddle(img: np.ndarray) -> tuple[list, float]:
    """PaddleOCR extraction"""
    try:
        result = _paddle_ocr.ocr(img, cls=True)
        if not result or not result[0]:
            return [], 0.0
        lines = []
        confidences = []
        for line in result[0]:
            text, conf = line[1]
            lines.append(text)
            confidences.append(conf)
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        return lines, avg_conf
    except Exception as e:
        logger.error(f"[PaddleOCR] Error: {e}")
        if USE_TESSERACT:
            return _run_tesseract(img)
        return [], 0.0


def _run_tesseract(img: np.ndarray) -> tuple[list, float]:
    """Tesseract OCR extraction"""
    try:
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        lines = []
        confidences = []
        current_line = []
        current_block = -1

        for i, word in enumerate(data["text"]):
            if word.strip():
                conf = data["conf"][i]
                if conf > 0:
                    block = data["block_num"][i]
                    line_num = data["line_num"][i]
                    key = (block, line_num)
                    current_line.append(word)
                    confidences.append(conf)

        full_text = pytesseract.image_to_string(img)
        lines = [l.strip() for l in full_text.split('\n') if l.strip()]
        avg_conf = sum(confidences) / len(confidences) / 100.0 if confidences else 0.0
        return lines, avg_conf
    except Exception as e:
        logger.error(f"[Tesseract] Error: {e}")
        return [], 0.0


# ── QR/Barcode Detection ────────────────────────────────────────────────────

def _extract_qr_data(img: np.ndarray) -> str:
    """Extract QR code or barcode data from image"""
    if USE_PYZBAR:
        try:
            decoded = pyzbar.decode(img)
            if decoded:
                return decoded[0].data.decode("utf-8")
        except Exception as e:
            logger.debug(f"[QR] pyzbar failed: {e}")

    # OpenCV QR detector fallback
    try:
        qr_detector = cv2.QRCodeDetector()
        data, _, _ = qr_detector.detectAndDecode(img)
        if data:
            return data
    except Exception:
        pass

    return ""


# ── Field Extraction (Regex + NLP rules) ────────────────────────────────────

def extract_name(text: str) -> str:
    """Extract recipient name from certificate text"""
    patterns = [
        r"(?:This is to certify|hereby certify|awarded to|presented to|certify that)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})",
        r"(?:Name|Student|Candidate|Recipient)\s*[:\-–]\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})",
        r"^([A-Z][A-Z\s]{5,40})$",  # All-caps name on its own line
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if 3 < len(name) < 60:
                return name
    return ""


def extract_issuer(text: str) -> str:
    """Extract issuing institution name"""
    patterns = [
        r"(?:Issued by|Issued By|Issuer|Institute|University|College|School|Academy|Organisation)\s*[:\-–]?\s*([A-Z][A-Za-z\s&,\.]{5,80})",
        r"((?:University|Institute|College|Academy|School|Board|Council|IIT|IIM|NIT|AIIMS)\s+of\s+[A-Z][A-Za-z\s]{3,50})",
        r"((?:IIT|IIM|NIT|BITS|AIIMS|VIT|MIT|Harvard|Stanford|Oxford|Cambridge|IGNOU)\s*[A-Za-z\s,\.]{0,40})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.MULTILINE)
        if match:
            issuer = match.group(1).strip()
            # Clean trailing punctuation
            issuer = re.sub(r"[,\.\-–]+$", "", issuer).strip()
            if 3 < len(issuer) < 100:
                return issuer
    return ""


def extract_title(text: str) -> str:
    """Extract certificate/degree title"""
    patterns = [
        r"(?:Certificate of|Certificate in|Degree of|Diploma in|Award of)\s+([A-Za-z\s&,\.]{5,80})",
        r"(?:Bachelor|Master|Doctor|PhD|B\.Tech|M\.Tech|MBA|BCA|MCA|B\.Sc|M\.Sc)\s+(?:of\s+)?(?:in\s+)?([A-Za-z\s&,\.]{3,60})",
        r"((?:Course|Program|Programme)\s+(?:Completion|Certificate|Award)\s+in\s+[A-Za-z\s&,\.]{5,60})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            title = match.group(0).strip()
            if len(title) > 5:
                return title
    return ""


def extract_date(text: str) -> str:
    """Extract issue/completion date"""
    patterns = [
        r"(?:Date|Dated|Issued on|Date of Issue|Completion Date|Valid from)\s*[:\-–]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
        r"(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})",
        r"((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})",
        r"(\d{4}-\d{2}-\d{2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""


def extract_certificate_id(text: str) -> str:
    """Extract certificate ID/number"""
    patterns = [
        r"(?:Certificate\s+(?:No|Number|ID)|Cert\.?\s*(?:No|ID))\s*[:\-–#]?\s*([A-Z0-9\-\/]{4,30})",
        r"(?:Serial|Reg\.?\s*No|Roll\s*No)\s*[:\-–#]?\s*([A-Z0-9\-\/]{4,30})",
        r"\b([A-Z]{2,6}[-\/]?\d{4}[-\/]?\d{4,8})\b",  # Pattern like CERT-2024-12345
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""


def extract_registration(text: str) -> str:
    """Extract registration/enrollment number"""
    patterns = [
        r"(?:Registration|Enrollment|Enrolment)\s*(?:No|Number|ID)?\s*[:\-–#]?\s*([A-Z0-9\/\-]{4,25})",
        r"\bReg\.?\s*No\.?\s*[:\-]?\s*([A-Z0-9\/\-]{4,25})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""


def extract_signatories(text: str) -> list:
    """Extract signatories/signers"""
    signatories = []
    patterns = [
        r"(?:Signed by|Signature of|Authorised by|Authorized by)\s*[:\-–]?\s*([A-Z][a-zA-Z\s\.]{3,50})",
        r"(?:Director|Principal|Dean|Registrar|HOD|Chairman)\s+([A-Z][a-zA-Z\s\.]{3,40})",
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            name = m.strip()
            if name and name not in signatories:
                signatories.append(name)
    return signatories[:5]  # Max 5
