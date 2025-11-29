from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""
    
    # Cal.com
    calcom_api_key: str = ""
    calcom_event_type_id: str = ""
    
    # Resend Email
    resend_api_key: str = ""
    email_from: str = "noreply@example.com"
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    frontend_url: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env


@lru_cache()
def get_settings() -> Settings:
    return Settings()
