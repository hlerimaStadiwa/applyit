from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "ApplyIt Intelligent HR Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:4436@localhost:5432/applyit",
        validation_alias="DATABASE_URL"
    )
    
    # JWT Auth
    JWT_SECRET_KEY: str = Field(
        default="super_secret_key_applyit_platform_development_2026_change_me_in_prod",
        validation_alias="JWT_SECRET_KEY"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
