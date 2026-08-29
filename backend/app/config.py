import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "DISASTERFOG AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super-secret-key-disasterfog-ai-2026-production-grade")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./disasterfog.db")
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL", None)
    
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY", "AIzaSyDrQwNGJgcbiQs6gZu6Fz0l81w0gF7Uswo")
    MAP_PROVIDER_KEY: Optional[str] = os.getenv("MAP_PROVIDER_KEY", "AIzaSyCjKQHHYbSlFklAva69Nf2ah-gujRWzzI0")
    SATELLITE_API_KEY: Optional[str] = os.getenv("SATELLITE_API_KEY", None)
    
    # Priority score default weights (Admin configurable)
    WEIGHT_SEVERITY: float = 0.30
    WEIGHT_PEOPLE_AT_RISK: float = 0.25
    WEIGHT_VULNERABILITY: float = 0.15
    WEIGHT_ACCESS_DIFFICULTY: float = 0.10
    WEIGHT_CONFIDENCE: float = 0.10
    WEIGHT_TIME_CRITICALITY: float = 0.10

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
