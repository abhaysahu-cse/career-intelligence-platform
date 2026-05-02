"""
Image Preprocessor
Handles: PDF-to-image conversion, deskewing, denoising, contrast enhancement
"""
import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import tempfile
from utils.logger import get_logger

log = get_logger(__name__)

try:
    from pdf2image import convert_from_path
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    log.warning("pdf2image not available - PDF support disabled")


class ImagePreprocessor:

    def preprocess(self, file_path: str) -> dict:
        """
        Returns dict with paths to preprocessed images:
        {
          "primary": str,       # Main enhanced image for OCR
          "grayscale": str,     # Grayscale version
          "original": str,      # Original (for tamper analysis)
          "pages": list[str]    # All pages (multi-page PDF)
        }
        """
        ext = os.path.splitext(file_path)[1].lower()
        tmp_dir = tempfile.mkdtemp(prefix="cae_")

        if ext == ".pdf":
            return self._process_pdf(file_path, tmp_dir)
        else:
            return self._process_image(file_path, tmp_dir)

    # ── PDF handling ──────────────────────────────────────────────────────────

    def _process_pdf(self, file_path: str, tmp_dir: str) -> dict:
        if not PDF_SUPPORT:
            raise RuntimeError("pdf2image not installed. Cannot process PDF.")

        log.info("Converting PDF to images", file=file_path)
        pages = convert_from_path(file_path, dpi=300, fmt="jpeg")

        page_paths = []
        for i, page in enumerate(pages):
            p = os.path.join(tmp_dir, f"page_{i}.jpg")
            page.save(p, "JPEG", quality=95)
            page_paths.append(p)

        # Use first page as primary
        primary_raw = page_paths[0]
        primary_enhanced = self._enhance_image(primary_raw, tmp_dir, "primary_enhanced.jpg")
        gray = self._to_grayscale(primary_enhanced, tmp_dir, "gray.jpg")

        return {
            "primary": primary_enhanced,
            "grayscale": gray,
            "original": primary_raw,
            "pages": page_paths,
            "page_count": len(page_paths)
        }

    # ── Image handling ────────────────────────────────────────────────────────

    def _process_image(self, file_path: str, tmp_dir: str) -> dict:
        img = cv2.imread(file_path)
        if img is None:
            raise ValueError(f"Cannot read image: {file_path}")

        log.info("Processing image", shape=img.shape, file=file_path)

        # Save original copy
        original_path = os.path.join(tmp_dir, "original.jpg")
        cv2.imwrite(original_path, img)

        # Full enhancement pipeline
        enhanced = self._pipeline(img)

        enhanced_path = os.path.join(tmp_dir, "enhanced.jpg")
        cv2.imwrite(enhanced_path, enhanced)

        # Grayscale
        gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
        gray_path = os.path.join(tmp_dir, "gray.jpg")
        cv2.imwrite(gray_path, gray)

        return {
            "primary": enhanced_path,
            "grayscale": gray_path,
            "original": original_path,
            "pages": [enhanced_path],
            "page_count": 1
        }

    # ── Core pipeline ─────────────────────────────────────────────────────────

    def _pipeline(self, img: np.ndarray) -> np.ndarray:
        img = self._resize_if_needed(img)
        img = self._deskew(img)
        img = self._denoise(img)
        img = self._enhance_contrast(img)
        img = self._sharpen(img)
        return img

    def _resize_if_needed(self, img: np.ndarray, max_dim: int = 3000) -> np.ndarray:
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            log.debug("Resized image", original=(w, h), new=(new_w, new_h))
        return img

    def _deskew(self, img: np.ndarray) -> np.ndarray:
        """Correct skew / rotation using Hough transform"""
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)

            if lines is None:
                return img

            angles = []
            for line in lines[:20]:
                rho, theta = line[0]
                angle = (theta - np.pi / 2) * 180 / np.pi
                if abs(angle) < 45:
                    angles.append(angle)

            if not angles:
                return img

            median_angle = float(np.median(angles))
            if abs(median_angle) < 0.5:
                return img  # No significant skew

            log.debug("Correcting skew", angle=median_angle)
            h, w = img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            rotated = cv2.warpAffine(img, M, (w, h),
                                     flags=cv2.INTER_CUBIC,
                                     borderMode=cv2.BORDER_REPLICATE)
            return rotated
        except Exception as e:
            log.warning("Deskew failed", error=str(e))
            return img

    def _denoise(self, img: np.ndarray) -> np.ndarray:
        return cv2.fastNlMeansDenoisingColored(img, None, 6, 6, 7, 21)

    def _enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        """CLAHE contrast enhancement"""
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    def _sharpen(self, img: np.ndarray) -> np.ndarray:
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        return cv2.filter2D(img, -1, kernel)

    def _enhance_image(self, path: str, tmp_dir: str, name: str) -> str:
        img = cv2.imread(path)
        enhanced = self._pipeline(img)
        out = os.path.join(tmp_dir, name)
        cv2.imwrite(out, enhanced)
        return out

    def _to_grayscale(self, path: str, tmp_dir: str, name: str) -> str:
        img = cv2.imread(path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        out = os.path.join(tmp_dir, name)
        cv2.imwrite(out, gray)
        return out
