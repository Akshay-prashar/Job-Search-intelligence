import logging
from typing import List, Dict, Any
from app.ingestion.base_fetcher import BaseFetcher

logger = logging.getLogger("LeverFetcher")

class LeverFetcher(BaseFetcher):
    BASE_URL = "https://api.lever.co/v0/postings"

    async def fetch_and_store(self, company_slug: str) -> List[Dict[str, Any]]:
        """Fetch jobs from Lever board and save to raw_ingestions."""
        url = f"{self.BASE_URL}/{company_slug}"
        logger.info(f"Fetching jobs from Lever company slug: {company_slug}")
        
        try:
            response = await self.http_get(url)
            jobs = response.json()
            if not isinstance(jobs, list):
                logger.error(f"Expected list response from Lever API, got: {type(jobs)}")
                return []
                
            logger.info(f"Fetched {len(jobs)} jobs from {company_slug}")
            
            stored_jobs = []
            for job in jobs:
                ext_id = str(job.get("id"))
                # Combine different description fields for full text representation
                desc_text = ""
                description = job.get("descriptionPlain", "")
                lists = job.get("lists", [])
                list_text = "\n".join([item.get("text", "") + "\n" + item.get("content", "") for item in lists if isinstance(item, dict)])
                full_text = f"{description}\n{list_text}"
                
                await self.store_raw(
                    external_id=ext_id,
                    raw_payload=job,
                    raw_text=full_text
                )
                stored_jobs.append(job)
                
            return stored_jobs
            
        except Exception as e:
            logger.error(f"Error fetching Lever listings for {company_slug}: {str(e)}")
            return []
