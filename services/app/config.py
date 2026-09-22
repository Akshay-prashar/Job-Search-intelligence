import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/jobintel"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    GITHUB_TOKEN: str = ""
    INTERNAL_API_KEY: str = "internal-secret-key"
    UPLOAD_DIR: str = "./uploads"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
