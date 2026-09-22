import feedparser
import logging
from typing import List, Dict, Any
from app.ingestion.base_fetcher import BaseFetcher

logger = logging.getLogger("RSSFetcher")

class RSSFetcher(BaseFetcher):
    async def fetch_and_store(self, feed_url: str, company_name: str) -> List[Dict[str, Any]]:
        """Fetch RSS feeds (engineering blogs) and store them."""
        logger.info(f"Fetching RSS feed for {company_name}: {feed_url}")
        
        try:
            # Note: feedparser runs synchronously. For local/demo, calling it directly is fine.
            # In massive production scale, we can run it in an executor thread.
            feed = feedparser.parse(feed_url)
            entries = []
            
            for idx, entry in enumerate(feed.entries[:5]):  # limit to top 5 recent posts
                ext_id = f"rss-{company_name}-{idx}"
                item = {
                    "company_name": company_name,
                    "title": entry.get("title"),
                    "link": entry.get("link"),
                    "published": entry.get("published"),
                    "summary": entry.get("summary", "")[:500]
                }
                
                await self.store_raw(
                    external_id=ext_id,
                    raw_payload=dict(entry),
                    raw_text=entry.get("summary") or entry.get("title")
                )
                entries.append(item)
                
            return entries
            
        except Exception as e:
            logger.error(f"Error fetching RSS for {company_name} from {feed_url}: {str(e)}")
            return []
