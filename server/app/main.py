from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core import settings
from app.db import Base, engine
from app import models  # noqa: F401

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup; swap for Alembic in production
Base.metadata.create_all(bind=engine)

app.include_router(api_router)


@app.get("/", tags=["root"])
def read_root() -> dict[str, str]:
    return {"message": "Welcome to the FastAPI skeleton."}
