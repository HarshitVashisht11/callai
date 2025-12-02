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
    email_from: str = ""
    
    frontend_url: str = ""
    # Note: CORS origins removed for now
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env


@lru_cache()
def get_settings() -> Settings:
    return Settings()
