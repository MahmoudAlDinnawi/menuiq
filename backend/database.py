"""
Database Configuration Module

This module sets up the database connection and provides:
- PostgreSQL database engine configuration
- SQLAlchemy session management
- Base model class for all database models
- Database session dependency for FastAPI
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# PostgreSQL connection URL
# Format: postgresql://username:password@host:port/database
# In production, this should be set via environment variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/menuiq_dev")

# Create database engine with connection pool settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Test connections before using them
    pool_size=10,        # Number of connections to maintain in pool
    max_overflow=20      # Maximum overflow connections allowed
)

# Create a session factory
# - autocommit=False: Requires explicit commits
# - autoflush=False: Doesn't auto-flush before queries
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all database models
Base = declarative_base()

# FastAPI dependency to get database session
# This ensures proper session cleanup after each request
def get_db():
    """
    Provides a database session for each request.
    Automatically closes the session when the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()