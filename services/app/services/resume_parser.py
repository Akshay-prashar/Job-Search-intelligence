import io
import re

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

class ResumeParser:
    @staticmethod
    def clean_text(text: str) -> str:
        """Normalize whitespace while preserving line structure."""
        # Replace carriage returns
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        # Replace non-breaking spaces
        text = text.replace('\xa0', ' ')
        # Collapse multiple horizontal spaces/tabs to a single space
        text = re.sub(r'[ \t]+', ' ', text)
        # Collapse 3 or more newlines to at most 2
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Remove control characters (except newline \n and tab \t)
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
        return text.strip()

    def parse_pdf(self, file_bytes: bytes) -> str:
        """Parse PDF text using PyMuPDF, falling back to pdfplumber if necessary."""
        text = ""
        
        # 1. Try PyMuPDF first (fastest and most accurate)
        if fitz is not None:
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                for page in doc:
                    text += page.get_text()
                doc.close()
            except Exception:
                text = ""

        # 2. Try pdfplumber as fallback
        if not text and pdfplumber is not None:
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
            except Exception:
                text = ""

        # 3. Fallback raw text decode if text file disguised as PDF
        if not text:
            try:
                text = file_bytes.decode("utf-8", errors="ignore")
                # Ensure it looks like textual content
                if len(text.strip()) < 20:
                    text = ""
            except Exception:
                text = ""

        cleaned = self.clean_text(text)
        if not cleaned:
            raise ValueError("Parsed PDF returned empty text. PDF might be scanned, encrypted, or image-based.")
            
        return cleaned
