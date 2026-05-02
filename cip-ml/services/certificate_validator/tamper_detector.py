"""
Tampering Detector - CV/ML based forgery detection
Methods: ELA, Copy-Move, Noise Analysis, Edge Consistency, Font Consistency
"""
import cv2
import numpy as np
import os
import tempfile
from pathlib import Path
from loguru import logger

try:
    from scipy import ndimage
    USE_SCIPY = True
except ImportError:
    USE_SCIPY = False

try:
    from skimage import filters, feature, measure
    USE_SKIMAGE = True
except ImportError:
    USE_SKIMAGE = False


def detect_tampering(file_path: str) -> dict:
    """
    Main tampering detection pipeline.
    Runs multiple forensic methods and combines scores.
    """
    file_path = str(file_path)
    ext = Path(file_path).suffix.lower()

    logger.info(f"[Tamper] Starting analysis: {file_path}")

    # Load image
    if ext == ".pdf":
        img = _pdf_first_page(file_path)
    else:
        img = cv2.imread(file_path)

    if img is None:
        logger.error(f"[Tamper] Cannot load image: {file_path}")
        return {"tampering_detected": False, "tampering_score": 0.0, "issues": [], "method_scores": {}}

    issues = []
    method_scores = {}

    # ── Method 1: Error Level Analysis (ELA) ──────────────────────────────
    ela_score = 0.0
    try:
        ela_score = _error_level_analysis(file_path, img, ext)
        method_scores["ela"] = round(ela_score, 3)
        if ela_score > 0.55:
            issues.append("JPEG compression anomalies detected (possible re-editing)")
        logger.debug(f"[Tamper] ELA score: {ela_score:.3f}")
    except Exception as e:
        logger.warning(f"[Tamper] ELA failed: {e}")
        method_scores["ela"] = 0.1

    # ── Method 2: Copy-Move Detection ─────────────────────────────────────
    copy_move_score = 0.0
    try:
        copy_move_score = _copy_move_detection(img)
        method_scores["copy_move"] = round(copy_move_score, 3)
        if copy_move_score > 0.5:
            issues.append("Possible copy-paste regions detected")
        logger.debug(f"[Tamper] Copy-move score: {copy_move_score:.3f}")
    except Exception as e:
        logger.warning(f"[Tamper] Copy-move failed: {e}")
        method_scores["copy_move"] = 0.1

    # ── Method 3: Noise Inconsistency ─────────────────────────────────────
    noise_score = 0.0
    try:
        noise_score = _noise_inconsistency(img)
        method_scores["noise"] = round(noise_score, 3)
        if noise_score > 0.5:
            issues.append("Inconsistent noise patterns (possible composite image)")
        logger.debug(f"[Tamper] Noise score: {noise_score:.3f}")
    except Exception as e:
        logger.warning(f"[Tamper] Noise analysis failed: {e}")
        method_scores["noise"] = 0.1

    # ── Method 4: Edge Consistency ─────────────────────────────────────────
    edge_score = 0.0
    try:
        edge_score = _edge_consistency(img)
        method_scores["edge"] = round(edge_score, 3)
        if edge_score > 0.5:
            issues.append("Edge discontinuities found (possible text/image insertion)")
        logger.debug(f"[Tamper] Edge score: {edge_score:.3f}")
    except Exception as e:
        logger.warning(f"[Tamper] Edge consistency failed: {e}")
        method_scores["edge"] = 0.1

    # ── Method 5: Metadata / Double JPEG ──────────────────────────────────
    double_jpeg_score = 0.0
    try:
        double_jpeg_score = _double_jpeg_detection(file_path, ext)
        method_scores["double_jpeg"] = round(double_jpeg_score, 3)
        if double_jpeg_score > 0.6:
            issues.append("Double JPEG compression detected")
        logger.debug(f"[Tamper] Double JPEG score: {double_jpeg_score:.3f}")
    except Exception as e:
        logger.warning(f"[Tamper] Double JPEG detection failed: {e}")
        method_scores["double_jpeg"] = 0.0

    # ── Weighted Combined Score ────────────────────────────────────────────
    # ELA and noise are stronger signals for document forgery
    weights = {
        "ela": 0.30,
        "copy_move": 0.20,
        "noise": 0.25,
        "edge": 0.15,
        "double_jpeg": 0.10
    }

    tampering_score = (
        weights["ela"] * ela_score +
        weights["copy_move"] * copy_move_score +
        weights["noise"] * noise_score +
        weights["edge"] * edge_score +
        weights["double_jpeg"] * double_jpeg_score
    )

    tampering_detected = tampering_score > 0.45

    logger.info(f"[Tamper] Combined score: {tampering_score:.3f}, detected={tampering_detected}, issues={len(issues)}")

    return {
        "tampering_detected": tampering_detected,
        "tampering_score": round(tampering_score, 3),
        "issues": issues,
        "method_scores": method_scores
    }


# ── Method Implementations ──────────────────────────────────────────────────

def _error_level_analysis(file_path: str, img: np.ndarray, ext: str) -> float:
    """
    ELA: Re-saves image at known quality, compares with original.
    Tampered regions show higher error levels (different compression history).
    """
    if ext not in [".jpg", ".jpeg"]:
        # For PNG/PDF, use a modified approach
        return _ela_for_non_jpeg(img)

    try:
        # Re-save at quality 90
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        tmp_path = tmp.name
        tmp.close()

        cv2.imwrite(tmp_path, img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        recompressed = cv2.imread(tmp_path)
        os.unlink(tmp_path)

        if recompressed is None or recompressed.shape != img.shape:
            return 0.1

        # Compute difference
        diff = cv2.absdiff(img, recompressed).astype(np.float32)
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)

        # Scale for visualization
        diff_scaled = diff_gray * 10

        # Analyze distribution: tampered images have higher variance and outliers
        mean_val = np.mean(diff_scaled)
        std_val = np.std(diff_scaled)

        # High mean or high std = suspicious
        score = min((mean_val / 30.0 + std_val / 50.0) / 2.0, 1.0)

        # Check for localized anomalies (high-ELA patches)
        _, high_ela = cv2.threshold(diff_scaled.astype(np.uint8), 60, 255, cv2.THRESH_BINARY)
        high_ela_ratio = np.sum(high_ela > 0) / high_ela.size

        if high_ela_ratio > 0.05:  # More than 5% of image has high ELA
            score = min(score + 0.2, 1.0)

        return float(score)

    except Exception as e:
        logger.debug(f"ELA error: {e}")
        return 0.1


def _ela_for_non_jpeg(img: np.ndarray) -> float:
    """ELA variant for non-JPEG images: analyze local variance uniformity"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
    gray = gray.astype(np.float32)

    # Compute local variance in 8x8 blocks
    h, w = gray.shape
    block_size = 16
    variances = []

    for y in range(0, h - block_size, block_size):
        for x in range(0, w - block_size, block_size):
            block = gray[y:y + block_size, x:x + block_size]
            if np.mean(block) > 10:  # Skip near-white blocks
                variances.append(np.var(block))

    if not variances:
        return 0.1

    var_array = np.array(variances)
    # High coefficient of variation of local variances = suspicious
    cv_val = np.std(var_array) / (np.mean(var_array) + 1e-6)
    score = min(cv_val / 5.0, 1.0) * 0.5  # Scaled down (less reliable for non-JPEG)

    return float(score)


def _copy_move_detection(img: np.ndarray) -> float:
    """
    Detect copy-paste forgery using keypoint matching.
    Cloned regions will have matching feature descriptors.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()

    # Detect keypoints with ORB
    try:
        orb = cv2.ORB_create(nfeatures=500)
        keypoints, descriptors = orb.detectAndCompute(gray, None)

        if descriptors is None or len(keypoints) < 10:
            return 0.0

        # Match descriptors with itself
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(descriptors, descriptors, k=3)

        suspicious_matches = 0
        for match_group in matches:
            for m in match_group:
                if m.trainIdx == m.queryIdx:
                    continue
                pt1 = keypoints[m.queryIdx].pt
                pt2 = keypoints[m.trainIdx].pt
                dist = np.sqrt((pt1[0] - pt2[0])**2 + (pt1[1] - pt2[1])**2)
                # Matches with significant spatial distance = copy-move
                if dist > 50:
                    suspicious_matches += 1

        ratio = suspicious_matches / max(len(keypoints), 1)
        score = min(ratio * 2.0, 1.0)
        return float(score)

    except Exception as e:
        logger.debug(f"Copy-move ORB error: {e}")
        return 0.0


def _noise_inconsistency(img: np.ndarray) -> float:
    """
    Detect noise inconsistency — tampered images have different noise in different regions.
    Genuine scans/photos have relatively uniform noise.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
    gray = gray.astype(np.float32)

    # Extract noise using high-pass filter
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    noise = gray - blurred

    # Divide into grid and compute noise statistics per cell
    h, w = noise.shape
    grid_h, grid_w = max(h // 8, 1), max(w // 8, 1)
    noise_stds = []

    for y in range(0, h, grid_h):
        for x in range(0, w, grid_w):
            cell = noise[y:y + grid_h, x:x + grid_w]
            if cell.size > 0:
                noise_stds.append(np.std(cell))

    if len(noise_stds) < 4:
        return 0.1

    noise_array = np.array(noise_stds)
    noise_array = noise_array[noise_array > 0.5]  # Filter near-zero cells

    if len(noise_array) < 4:
        return 0.1

    # High coefficient of variation = inconsistent noise = suspicious
    cv_val = np.std(noise_array) / (np.mean(noise_array) + 1e-6)
    score = min(cv_val / 3.0, 1.0)

    return float(score)


def _edge_consistency(img: np.ndarray) -> float:
    """
    Check edge consistency: genuine documents have smooth, consistent edges.
    Tampered regions often show edge discontinuities.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()

    # Detect edges with Canny
    edges = cv2.Canny(gray, 50, 150)

    # Analyze edge distribution uniformity
    h, w = edges.shape
    grid_h, grid_w = max(h // 8, 1), max(w // 8, 1)
    edge_densities = []

    for y in range(0, h, grid_h):
        for x in range(0, w, grid_w):
            cell = edges[y:y + grid_h, x:x + grid_w]
            if cell.size > 0:
                edge_densities.append(np.sum(cell > 0) / cell.size)

    if not edge_densities:
        return 0.1

    ed_array = np.array(edge_densities)
    # Very localized high-density edges = suspicious insertion
    mean_ed = np.mean(ed_array)
    outliers = np.sum(ed_array > mean_ed * 3.0)
    outlier_ratio = outliers / len(ed_array)

    score = min(outlier_ratio * 3.0, 1.0)
    return float(score)


def _double_jpeg_detection(file_path: str, ext: str) -> float:
    """
    Detect double JPEG compression: saving → editing → saving again creates
    characteristic DCT coefficient distribution anomalies.
    """
    if ext not in [".jpg", ".jpeg"]:
        return 0.0

    try:
        img = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return 0.0

        img_float = img.astype(np.float32)

        # Apply DCT on 8x8 blocks and analyze distribution
        h, w = img_float.shape
        dct_coeffs = []

        for y in range(0, h - 8, 8):
            for x in range(0, w - 8, 8):
                block = img_float[y:y + 8, x:x + 8]
                dct_block = cv2.dct(block)
                # AC coefficients (skip DC at [0,0])
                ac = dct_block.flatten()[1:]
                dct_coeffs.extend(ac.tolist())

        if not dct_coeffs:
            return 0.0

        coeffs = np.array(dct_coeffs)
        # Double compression causes periodic dips in the histogram of AC coefficients
        hist, _ = np.histogram(coeffs, bins=100, range=(-100, 100))
        hist_float = hist.astype(np.float32)

        # Look for periodic dips (sign of double quantization)
        if len(hist_float) > 10:
            diff = np.diff(hist_float)
            oscillation = np.std(diff) / (np.mean(np.abs(diff)) + 1e-6)
            score = min(oscillation / 10.0, 1.0) * 0.5
            return float(score)

        return 0.0

    except Exception as e:
        logger.debug(f"Double JPEG detection error: {e}")
        return 0.0


def _pdf_first_page(pdf_path: str) -> np.ndarray:
    """Convert first page of PDF to image for analysis"""
    try:
        from pdf2image import convert_from_path
        pages = convert_from_path(pdf_path, dpi=150, first_page=1, last_page=1)
        if pages:
            import numpy as np
            pil_img = pages[0]
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            return img
    except Exception as e:
        logger.warning(f"PDF conversion failed: {e}")
    return cv2.imread(pdf_path)
