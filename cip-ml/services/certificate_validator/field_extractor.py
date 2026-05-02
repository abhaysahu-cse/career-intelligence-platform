"""
Field Extractor
Extracts structured fields from raw OCR text using:
- Regex patterns
- Positional heuristics (from text blocks)
- Keyword proximity matching
"""
import re
from datetime import datetime
from typing import Optional
from utils.logger import get_logger

log = get_logger(__name__)


class FieldExtractor:

    # ── Regex patterns ────────────────────────────────────────────────────────

    NAME_PATTERNS = [
        r"(?:This is to certify that|awarded to|presented to|certify that)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})",
        r"(?:Name|Student Name|Candidate Name|Recipient)[\s:]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})",
        r"(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})",
    ]

    ISSUER_PATTERNS = [
        r"(?:Issued by|Issuer|Institution|University|College|School|Institute|Academy|Board)[\s:]+([A-Z][^\n,\.]{3,60})",
        r"([A-Z][a-zA-Z\s]+(?:University|College|Institute|Academy|School|Board|Council|Authority))",
        r"(?:^|\n)([A-Z][A-Z\s]{2,40}(?:UNIVERSITY|COLLEGE|INSTITUTE|ACADEMY|SCHOOL|BOARD))",
    ]

    CERT_ID_PATTERNS = [
        r"(?:Certificate No|Cert(?:ificate)?[\s#.:-]+No|ID|Reg(?:istration)?[\s#.-]+No|Serial No|Reference No)[\.:\s#-]+([A-Z0-9/_\-]{4,30})",
        r"(?:No\.|Number|#)[\s:]+([A-Z]{0,5}[0-9]{4,15}[A-Z0-9]*)",
        r"\b([A-Z]{2,6}[-/][0-9]{4}[-/][0-9]{2,8})\b",
        r"\b([A-Z]{1,4}[0-9]{8,15})\b",
    ]

    DATE_PATTERNS = [
        r"(?:Date of Issue|Issue Date|Issued On|Date|Awarded on|Valid From)[\s:]+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
        r"(?:Date of Issue|Issue Date|Issued On|Date|Awarded on)[\s:]+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})",
        r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})\b",
        r"\b(\d{4}-\d{2}-\d{2})\b",
    ]

    TITLE_PATTERNS = [
        r"(?:Certificate of|Degree of|This certifies|Diploma in|Award of)[\s:]+([A-Za-z\s,\-&]+?)(?:\n|in the field|with)",
        r"(?:has successfully completed|has completed)\s+([A-Za-z\s\-&:,]+?)(?:\.|course|program|\n)",
        r"(?:Bachelor|Master|Doctor|PhD|B\.Tech|M\.Tech|BCA|MCA|B\.Sc|M\.Sc|MBA|B\.E|M\.E)[^\n]{0,80}",
    ]

    SIGNATORY_PATTERNS = [
        r"(?:Signature|Signed by|Authorized by|Principal|Director|Dean|Registrar|Chairman|President|Vice Chancellor)[\s:]+([A-Z][a-zA-Z\s\.]+)",
    ]

    REG_NO_PATTERNS = [
        r"(?:Registration No|Roll No|Enrollment No|Admission No)[\s:.#-]+([A-Z0-9/_\-]{4,25})",
    ]

    def extract(self, raw_text: str, text_blocks: list) -> dict:
        """Extract all certificate fields from OCR text"""
        if not raw_text:
            return self._empty()

        # Normalize text
        text = self._normalize(raw_text)

        result = {
            "name": self._extract_name(text),
            "issuer": self._extract_issuer(text),
            "certificate_title": self._extract_title(text),
            "issue_date": self._extract_date(text),
            "certificate_id": self._extract_cert_id(text),
            "registration_number": self._extract_reg_no(text),
            "signatories": self._extract_signatories(text),
            "qr_code_data": self._extract_qr_from_blocks(text_blocks),
            "expiry_date": self._extract_expiry(text),
            "grade_or_marks": self._extract_grade(text),
            "field_completeness": 0.0
        }

        # Compute completeness score
        core_fields = ["name", "issuer", "certificate_title", "issue_date", "certificate_id"]
        filled = sum(1 for f in core_fields if result.get(f))
        result["field_completeness"] = filled / len(core_fields)

        log.debug("Extracted fields", fields={k: bool(v) for k, v in result.items() if k != "field_completeness"})
        return result

    # ── Individual extractors ─────────────────────────────────────────────────

    def _extract_name(self, text: str) -> str:
        for pattern in self.NAME_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if m:
                name = m.group(1).strip()
                if len(name.split()) >= 2:
                    return self._clean_name(name)
        return ""

    def _extract_issuer(self, text: str) -> str:
        for pattern in self.ISSUER_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if m:
                issuer = m.group(1).strip()
                if len(issuer) > 3:
                    return issuer.title()
        return ""

    def _extract_cert_id(self, text: str) -> str:
        for pattern in self.CERT_ID_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                cid = m.group(1).strip()
                if len(cid) >= 4:
                    return cid.upper()
        return ""

    def _extract_date(self, text: str) -> str:
        for pattern in self.DATE_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                raw_date = m.group(1).strip()
                return self._normalize_date(raw_date)
        return ""

    def _extract_title(self, text: str) -> str:
        for pattern in self.TITLE_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if m:
                title = m.group(0).strip()
                if 5 < len(title) < 200:
                    return title
        return ""

    def _extract_signatories(self, text: str) -> list:
        sigs = []
        for pattern in self.SIGNATORY_PATTERNS:
            for m in re.finditer(pattern, text, re.IGNORECASE):
                name = m.group(1).strip()
                if name and len(name) > 3:
                    sigs.append(name)
        return list(set(sigs))[:5]

    def _extract_reg_no(self, text: str) -> str:
        for pattern in self.REG_NO_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return m.group(1).strip().upper()
        return ""

    def _extract_qr_from_blocks(self, text_blocks: list) -> str:
        """Placeholder - QR decoding happens in IDQRValidator from image"""
        return ""

    def _extract_expiry(self, text: str) -> str:
        pattern = r"(?:Valid Until|Expiry Date|Expires on|Valid Till)[\s:]+(.{6,30})"
        m = re.search(pattern, text, re.IGNORECASE)
        return m.group(1).strip() if m else ""

    def _extract_grade(self, text: str) -> str:
        pattern = r"(?:Grade|CGPA|GPA|Marks|Score|Result)[\s:]+([A-Z0-9\.+\-/%]+)"
        m = re.search(pattern, text, re.IGNORECASE)
        return m.group(1).strip() if m else ""

    # ── Utilities ─────────────────────────────────────────────────────────────

    def _normalize(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = text.replace('\x00', '')
        return text.strip()

    def _clean_name(self, name: str) -> str:
        name = re.sub(r'\b(Mr|Mrs|Ms|Dr|Prof)\.\s*', '', name, flags=re.IGNORECASE)
        return ' '.join(w.capitalize() for w in name.split())

    def _normalize_date(self, date_str: str) -> str:
        formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
            "%d %B %Y", "%d %b %Y", "%B %d %Y",
            "%Y-%m-%d", "%d/%m/%y"
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return date_str

    def _empty(self) -> dict:
        return {
            "name": "", "issuer": "", "certificate_title": "",
            "issue_date": "", "certificate_id": "", "registration_number": "",
            "signatories": [], "qr_code_data": "", "expiry_date": "",
            "grade_or_marks": "", "field_completeness": 0.0
        }
