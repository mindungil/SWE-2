from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core import settings

# Use check_same_thread for SQLite when using synchronous driver
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
