import logging
from typing import List, Dict, Any
from app.ingestion.base_fetcher import BaseFetcher

logger = logging.getLogger("GreenhouseFetcher")

class GreenhouseFetcher(BaseFetcher):
    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    async def fetch_and_store(self, board_token: str) -> List[Dict[str, Any]]:
        """Fetch jobs from a Greenhouse board and save them to raw_ingestions."""
        url = f"{self.BASE_URL}/{board_token}/jobs?content=true"
        logger.info(f"Fetching jobs from Greenhouse board: {board_token}")
        
        try:
            response = await self.http_get(url)
            data = response.json()
            jobs = data.get("jobs", [])
            logger.info(f"Fetched {len(jobs)} jobs from {board_token}")
            
            stored_jobs = []
            for job in jobs:
                ext_id = str(job.get("id"))
                # Store the job payload
                await self.store_raw(
                    external_id=ext_id,
                    raw_payload=job,
                    raw_text=job.get("content")
                )
                stored_jobs.append(job)
                
            return stored_jobs
            
        except Exception as e:
            logger.error(f"Error fetching Greenhouse board {board_token}: {str(e)}")
            return []
