import hashlib
from typing import Dict, Any, Optional, Tuple

class Deduplicator:
    @staticmethod
    def compute_content_hash(job_data: Dict[str, Any]) -> str:
        """Create SHA-256 hash of canonical fields."""
        title = str(job_data.get("job_title", "")).lower().strip()
        desc = str(job_data.get("description", "")).lower().strip()
        # Clean whitespaces
        desc_clean = "".join(desc.split())[:1000] # First 1000 chars of desc
        
        canonical = f"{title}|{desc_clean}"
        return hashlib.sha256(canonical.encode('utf-8')).hexdigest()

    async def check_duplicate(self, db_session, job_data: Dict[str, Any]) -> Tuple[Optional[str], str]:
        """Check if job already exists. Returns (duplicate_of_id, content_hash)."""
        content_hash = self.compute_content_hash(job_data)
        
        from sqlalchemy import text
        query = text("SELECT id FROM jobs WHERE content_hash = :hash AND job_status = 'active' LIMIT 1")
        result = await db_session.execute(query, {"hash": content_hash})
        row = result.fetchone()
        
        if row:
            return str(row[0]), content_hash
            
        return None, content_hash
