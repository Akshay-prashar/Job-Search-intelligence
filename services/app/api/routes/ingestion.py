import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy import text
from app.api.deps import api_key
from app.core.database import async_session
from app.models.schemas import IngestionTriggerRequest, IngestionStatusResponse
from app.ingestion.greenhouse_fetcher import GreenhouseFetcher
from app.ingestion.lever_fetcher import LeverFetcher
from app.ingestion.github_fetcher import GitHubFetcher
from app.ingestion.rss_fetcher import RSSFetcher
from app.ingestion.normalizer import JobNormalizer
from app.ingestion.deduplicator import Deduplicator
from app.ingestion.embedding_pipeline import EmbeddingPipeline

logger = logging.getLogger("IngestionRoute")
router = APIRouter(prefix="/ingestion", tags=["ingestion"])

# Store pipeline progress
pipeline_status = {
    "status": "idle",
    "jobs_processed": 0,
    "duplicates_found": 0,
    "errors": []
}

async def run_ingestion_task(feed_id: Optional[str] = None):
    pipeline_status["status"] = "processing"
    pipeline_status["jobs_processed"] = 0
    pipeline_status["duplicates_found"] = 0
    pipeline_status["errors"] = []
    
    async with async_session() as db:
        try:
            # 1. Fetch active source feeds
            feed_query = "SELECT id, source_name, source_type, source_url FROM source_feeds WHERE active = true"
            if feed_id:
                feed_query += " AND id = :feed_id"
                result = await db.execute(text(feed_query), {"feed_id": feed_id})
            else:
                result = await db.execute(text(feed_query))
                
            feeds = result.fetchall()
            normalizer = JobNormalizer()
            dedup = Deduplicator()
            
            save_query = text("""
                INSERT INTO jobs 
                (company_id, external_job_id, job_title, role_type, location, remote_type, 
                 experience_level, job_type, department, description, skills_json, 
                 apply_url, source, source_url, posted_at, confidence_score, content_hash, job_status) 
                VALUES 
                ((SELECT id FROM companies WHERE LOWER(company_name) = LOWER(:comp) LIMIT 1), 
                 :ext_id, :title, :role, :loc, :remote, :exp, :type, :dept, :desc, :skills, 
                 :apply, :source, :src_url, :posted, :conf, :hash, 'active')
            """)
            
            for feed in feeds:
                f_id, f_name, f_type, f_url = str(feed[0]), feed[1], feed[2], feed[3]
                
                try:
                    # Greenhouse Ingestion
                    if f_type == "greenhouse":
                        board_token = f_name.split()[0].lower()
                        fetcher = GreenhouseFetcher(f_id, db)
                        jobs = await fetcher.fetch_and_store(board_token)
                        
                        for job in jobs:
                            norm = normalizer.normalize_greenhouse(job, f_name.split()[0])
                            dup_id, content_hash = await dedup.check_duplicate(db, norm)
                            if dup_id:
                                pipeline_status["duplicates_found"] += 1
                                continue
                                
                            await db.execute(save_query, {
                                "comp": f_name.split()[0],
                                "ext_id": norm["external_job_id"],
                                "title": norm["job_title"],
                                "role": norm["role_type"],
                                "loc": norm["location"],
                                "remote": norm["remote_type"],
                                "exp": norm["experience_level"],
                                "type": norm["job_type"],
                                "dept": norm["department"],
                                "desc": norm["description"],
                                "skills": json.dumps(norm["skills_json"]),
                                "apply": norm["apply_url"],
                                "source": norm["source"],
                                "src_url": norm["source_url"],
                                "posted": norm["posted_at"],
                                "conf": norm["confidence_score"],
                                "hash": content_hash
                            })
                            pipeline_status["jobs_processed"] += 1

                    # Lever Ingestion
                    elif f_type == "lever":
                        slug = f_name.split()[0].lower()
                        fetcher = LeverFetcher(f_id, db)
                        jobs = await fetcher.fetch_and_store(slug)
                        
                        for job in jobs:
                            norm = normalizer.normalize_lever(job, f_name.split()[0])
                            dup_id, content_hash = await dedup.check_duplicate(db, norm)
                            if dup_id:
                                pipeline_status["duplicates_found"] += 1
                                continue
                                
                            await db.execute(save_query, {
                                "comp": f_name.split()[0],
                                "ext_id": norm["external_job_id"],
                                "title": norm["job_title"],
                                "role": norm["role_type"],
                                "loc": norm["location"],
                                "remote": norm["remote_type"],
                                "exp": norm["experience_level"],
                                "type": norm["job_type"],
                                "dept": norm["department"],
                                "desc": norm["description"],
                                "skills": json.dumps(norm["skills_json"]),
                                "apply": norm["apply_url"],
                                "source": norm["source"],
                                "src_url": norm["source_url"],
                                "posted": norm["posted_at"],
                                "conf": norm["confidence_score"],
                                "hash": content_hash
                            })
                            pipeline_status["jobs_processed"] += 1

                    # GitHub Ingestion (e.g. SimplifyJobs markdown lists)
                    elif f_type == "github":
                        clean_url = f_url.replace("https://github.com/", "").strip("/")
                        url_parts = clean_url.split("/")
                        if len(url_parts) >= 2:
                            owner, repo = url_parts[0], url_parts[1]
                            fetcher = GitHubFetcher(f_id, db)
                            jobs = await fetcher.fetch_and_store(owner, repo)
                            
                            for job in jobs:
                                norm = normalizer.normalize_github(job, f"{owner}/{repo}")
                                dup_id, content_hash = await dedup.check_duplicate(db, norm)
                                if dup_id:
                                    pipeline_status["duplicates_found"] += 1
                                    continue
                                    
                                await db.execute(save_query, {
                                    "comp": norm.get("company_name", "Unknown"),
                                    "ext_id": norm["external_job_id"],
                                    "title": norm["job_title"],
                                    "role": norm["role_type"],
                                    "loc": norm["location"],
                                    "remote": norm["remote_type"],
                                    "exp": norm["experience_level"],
                                    "type": norm["job_type"],
                                    "dept": norm["department"],
                                    "desc": norm["description"],
                                    "skills": json.dumps(norm["skills_json"]),
                                    "apply": norm["apply_url"],
                                    "source": norm["source"],
                                    "src_url": norm["source_url"],
                                    "posted": norm["posted_at"],
                                    "conf": norm["confidence_score"],
                                    "hash": content_hash
                                })
                                pipeline_status["jobs_processed"] += 1

                    # RSS Ingestion (Engineering blogs)
                    elif f_type == "rss":
                        company_name = f_name.replace("Engineering Blog", "").replace("Blog", "").strip()
                        fetcher = RSSFetcher(f_id, db)
                        entries = await fetcher.fetch_and_store(f_url, company_name)
                        
                        insight_query = text("""
                            INSERT INTO company_insights 
                            (company_id, source, insight_type, raw_text, summarized_text, tags_json, confidence_score)
                            VALUES 
                            ((SELECT id FROM companies WHERE LOWER(company_name) = LOWER(:comp) LIMIT 1),
                             'rss', 'engineering', :raw_text, :summary, '["engineering", "blog"]', 0.60)
                        """)
                        for entry in entries:
                            await db.execute(insight_query, {
                                "comp": company_name,
                                "raw_text": entry.get("title", "") + ": " + entry.get("summary", ""),
                                "summary": entry.get("summary", "")[:300]
                            })

                    # Update last_fetched_at for this feed
                    await db.execute(
                        text("UPDATE source_feeds SET last_fetched_at = NOW(), updated_at = NOW() WHERE id = :id"),
                        {"id": f_id}
                    )
                    await db.commit()

                except Exception as e:
                    await db.rollback()
                    logger.error(f"Feed {f_name} failed: {str(e)}")
                    pipeline_status["errors"].append(f"Feed {f_name} failed: {str(e)}")

            # 2. Run Embeddings Pipeline to generate missing vectors
            try:
                pipeline = EmbeddingPipeline(db)
                await pipeline.generate_job_embeddings()
                await db.commit()
            except Exception as e:
                logger.error(f"Embedding generation failed: {str(e)}")
                pipeline_status["errors"].append(f"Embedding generation failed: {str(e)}")

            pipeline_status["status"] = "completed"
        except Exception as e:
            await db.rollback()
            logger.error(f"Pipeline crashed: {str(e)}")
            pipeline_status["status"] = "failed"
            pipeline_status["errors"].append(f"Pipeline crashed: {str(e)}")

@router.post("/trigger", response_model=IngestionStatusResponse, dependencies=[api_key])
async def trigger_ingestion(req: IngestionTriggerRequest, background_tasks: BackgroundTasks):
    if pipeline_status["status"] == "processing":
        return IngestionStatusResponse(**pipeline_status)
        
    background_tasks.add_task(run_ingestion_task, req.source_feed_id)
    pipeline_status["status"] = "processing"
    return IngestionStatusResponse(**pipeline_status)

@router.get("/status", response_model=IngestionStatusResponse, dependencies=[api_key])
async def get_ingestion_status():
    return IngestionStatusResponse(**pipeline_status)
