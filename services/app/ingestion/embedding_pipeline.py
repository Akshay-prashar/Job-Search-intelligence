import json
import logging
from sqlalchemy import text
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger("EmbeddingPipeline")

class EmbeddingPipeline:
    def __init__(self, db_session):
        self.db = db_session
        self.embedder = EmbeddingService()

    async def generate_job_embeddings(self) -> int:
        """Fetch active jobs without embeddings, generate them, and save."""
        query = text("""
            SELECT id, job_title, skills_json, description, minimum_qualifications 
            FROM jobs 
            WHERE embeddings_vector IS NULL AND job_status = 'active'
        """)
        result = await self.db.execute(query)
        rows = result.fetchall()
        
        if not rows:
            logger.info("No new jobs to embed")
            return 0
            
        logger.info(f"Generating embeddings for {len(rows)} jobs...")
        self.embedder.initialize()
        
        count = 0
        for row in rows:
            job_id, title, skills_json, desc, min_qual = row
            # Format skills list from JSON/text
            skills = []
            if skills_json:
                if isinstance(skills_json, str):
                    try:
                        skills = json.loads(skills_json)
                    except:
                        pass
                elif isinstance(skills_json, list):
                    skills = skills_json
                    
            job_data = {
                "job_title": title,
                "skills_json": skills,
                "description": desc,
                "minimum_qualifications": min_qual
            }
            
            vector = self.embedder.embed_job(job_data)
            
            update_query = text("""
                UPDATE jobs 
                SET embeddings_vector = :vec 
                WHERE id = :id
            """)
            await self.db.execute(update_query, {"vec": vector, "id": job_id})
            count += 1
            
        logger.info(f"Successfully generated embeddings for {count} jobs")
        return count
