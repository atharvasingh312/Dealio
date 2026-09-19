"""
Database configuration for Dealio CRM.

Uses SQLAlchemy 2.0 with SQLite. Provides a session factory
and a FastAPI dependency for request-scoped DB sessions.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from typing import Generator

# Store the database file next to the backend source
DATABASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{DATABASE_DIR / 'crm.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


def get_db() -> Generator:
    """
    FastAPI dependency that yields a database session.
    Ensures the session is closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
