import asyncio
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger("Scheduler")

class IngestionScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Background job ingestion scheduler started")
            
            # Setup demo schedules
            self.scheduler.add_job(
                self.trigger_ingestion,
                trigger=CronTrigger(hour="0,6,12,18"), # Every 6 hours
                id="greenhouse_lever_ingestion",
                replace_existing=True
            )

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler shutdown complete")

    def trigger_ingestion(self):
        """Invoke scheduled ingestion pipeline."""
        logger.info("Scheduled job ingestion triggered...")
        from app.api.routes.ingestion import run_ingestion_task
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(run_ingestion_task())
            else:
                loop.run_until_complete(run_ingestion_task())
        except RuntimeError:
            asyncio.run(run_ingestion_task())
        except Exception as e:
            logger.error(f"Failed to execute scheduled ingestion: {str(e)}")
