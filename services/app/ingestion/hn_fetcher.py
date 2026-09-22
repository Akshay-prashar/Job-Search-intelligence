import urllib.parse
import logging
from typing import List, Dict, Any
from app.ingestion.base_fetcher import BaseFetcher

logger = logging.getLogger("HNFetcher")

class HNFetcher(BaseFetcher):
    BASE_URL = "https://hn.algolia.com/api/v1/search"

    async def fetch_insights_and_store(self, company_name: str) -> List[Dict[str, Any]]:
        """Scrape HN insights via Algolia search for company culture/interviews."""
        queries = [
            f"{company_name} interview",
            f"{company_name} new grad",
            f"{company_name} internship",
            f"{company_name} culture"
        ]
        
        all_hits = []
        for q in queries:
            encoded_query = urllib.parse.quote(q)
            url = f"{self.BASE_URL}?query={encoded_query}&tags=story&hitsPerPage=5"
            logger.info(f"HN Search URL: {url}")
            
            try:
                response = await self.http_get(url)
                hits = response.json().get("hits", [])
                for hit in hits:
                    ext_id = f"hn-{hit.get('objectID')}"
                    item = {
                        "company_name": company_name,
                        "title": hit.get("title"),
                        "url": hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                        "points": hit.get("points"),
                        "num_comments": hit.get("num_comments"),
                        "author": hit.get("author"),
                        "query": q
                    }
                    
                    await self.store_raw(
                        external_id=ext_id,
                        raw_payload=hit,
                        raw_text=hit.get("story_text") or hit.get("title")
                    )
                    all_hits.append(item)
            except Exception as e:
                logger.error(f"Failed to query HN for '{q}': {str(e)}")
                
        return all_hits
