import re

def clean_text(text: str) -> str:
    """Clean extra spaces and unicode artifacts."""
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def clean_html(html: str) -> str:
    """Remove HTML tags cleanly."""
    if not html:
        return ""
    # Strip script/style tags completely
    html = re.sub(r'<(script|style).*?>.*?</\1>', '', html, flags=re.IGNORECASE|re.DOTALL)
    # Strip all other HTML tags
    text = re.sub(r'<[^>]*>', ' ', html)
    # Clean whitespace
    return clean_text(text)

def truncate_text(text: str, max_length: int = 200) -> str:
    """Truncate text to max length on word boundary."""
    if len(text) <= max_length:
        return text
    truncated = text[:max_length]
    # Find last space
    last_space = truncated.rfind(' ')
    if last_space > 0:
        return truncated[:last_space] + "..."
    return truncated + "..."
