import httpx
import hashlib
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger("Fetcher")

class BaseFetcher:
    def __init__(self, feed_id: str, db_session=None):
        self.feed_id = feed_id
        self.db = db_session

    async def http_get(self, url: str, headers: Optional[Dict[str, str]] = None) -> httpx.Response:
        """Fetch helper with basic retry/timeout handling."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(3):
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        return response
                    elif response.status_code == 429:
                        logger.warning(f"Rate limited (429) fetching {url}. Attempt {attempt+1}/3.")
                        # Minimal pause (standard async wait)
                        import asyncio
                        await asyncio.sleep(2 ** attempt)
                    else:
                        response.raise_for_status()
                except Exception as e:
                    if attempt == 2:
                        raise e
                    import asyncio
                    await asyncio.sleep(1)
            raise httpx.HTTPError("Failed to fetch after retries")

    def hash_content(self, payload: Dict[str, Any]) -> str:
        """Create SHA-256 hash of a JSON payload for deduplication."""
        serialized = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    async def store_raw(self, external_id: str, raw_payload: Dict[str, Any], raw_text: Optional[str] = None) -> str:
        """Write raw ingestion metadata to the raw_ingestions table."""
        content_hash = self.hash_content(raw_payload)
        
        # If db session is present, insert into database
        if self.db:
            from sqlalchemy import text
            query = text("""
                INSERT INTO raw_ingestions 
                (source_feed_id, external_id, raw_payload, raw_text, content_hash, fetched_at, processing_status) 
                VALUES (:feed_id, :ext_id, :payload, :text, :hash, :fetched_at, 'pending')
                ON CONFLICT DO NOTHING
                RETURNING id
            """)
            result = await self.db.execute(query, {
                "feed_id": self.feed_id,
                "ext_id": external_id,
                "payload": json.dumps(raw_payload),
                "text": raw_text,
                "hash": content_hash,
                "fetched_at": datetime.utcnow()
            })
            row = result.fetchone()
            return str(row[0]) if row else ""
            
        logger.info(f"Raw storage logic simulated for external ID {external_id}")
        return content_hash
