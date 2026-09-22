from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_api_key

# Unified API route dependencies
db_session = Depends(get_db)
api_key = Depends(verify_api_key)
