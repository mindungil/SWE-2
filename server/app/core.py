from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Example FastAPI Server"
    environment: str = "local"
    database_url: str = "sqlite:///./data/app.db"


settings = Settings()
