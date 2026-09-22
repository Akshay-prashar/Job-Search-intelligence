import logging
import base64
import re
from typing import List, Dict, Any
from app.ingestion.base_fetcher import BaseFetcher
from app.config import settings

logger = logging.getLogger("GitHubFetcher")

class GitHubFetcher(BaseFetcher):
    BASE_URL = "https://api.github.com"

    async def fetch_readme_markdown(self, owner: str, repo: str, path: str = "README.md") -> str:
        """Fetch README base64 content and decode it."""
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/contents/{path}"
        headers = {"Accept": "application/vnd.github.v3+json"}
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"
            
        logger.info(f"Fetching GitHub repo contents: {owner}/{repo}/{path}")
        try:
            response = await self.http_get(url, headers=headers)
            data = response.json()
            content_b64 = data.get("content", "")
            if not content_b64:
                return ""
            decoded_bytes = base64.b64decode(content_b64.replace("\n", ""))
            return decoded_bytes.decode("utf-8")
        except Exception as e:
            logger.error(f"Error fetching GitHub contents for {owner}/{repo}: {str(e)}")
            return ""

    def parse_markdown_table(self, markdown: str) -> List[Dict[str, Any]]:
        """A simple line-based parser extracting job details from markdown tables."""
        jobs = []
        lines = markdown.split("\n")
        
        # Simple extraction strategy: find lines starting with "|" containing links/details
        # Standard curated list headers look like: | Company | Role | Location | Application Link | Date |
        for idx, line in enumerate(lines):
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 4 and not line.startswith("|-") and "company" not in parts[0].lower() and idx > 5:
                # Attempt to extract company and apply links
                comp_part = parts[0]
                role_part = parts[1]
                loc_part = parts[2]
                link_part = parts[3]
                
                # Extract URL from markdown format [LinkText](URL)
                link_url = ""
                link_match = re.search(r'\[.*?\]\((.*?)\)', link_part)
                if link_match:
                    link_url = link_match.group(1)
                elif link_part.startswith("http"):
                    link_url = link_part
                    
                comp_name = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', comp_part).strip()
                
                if comp_name and role_part and link_url:
                    jobs.append({
                        "company_name": comp_name,
                        "job_title": role_part,
                        "location": loc_part,
                        "apply_url": link_url,
                        "source": "github",
                        "raw_line": line
                    })
                    
        return jobs

    async def fetch_and_store(self, owner: str, repo: str, path: str = "README.md") -> List[Dict[str, Any]]:
        markdown = await self.fetch_readme_markdown(owner, repo, path)
        if not markdown:
            return []
            
        jobs = self.parse_markdown_table(markdown)
        logger.info(f"Parsed {len(jobs)} jobs from {owner}/{repo}")
        
        for idx, job in enumerate(jobs):
            # Store mock raw payload for index/tracking
            await self.store_raw(
                external_id=f"github-{owner}-{repo}-{idx}",
                raw_payload=job,
                raw_text=job.get("raw_line")
            )
            
        return jobs

class GitHubFetcherService:
    fetch = GitHubFetcher
