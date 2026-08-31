from app.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# This is the url which create engine needs, to set up the connection to the postgreSQL database
DATABASE_URL = (f"postgresql+psycopg2://{settings.db_user}:{settings.db_password}"
                f"@{settings.db_host}:{settings.db_port}/{settings.db_name}")

# This creates the Engine object, responsible for establishing a connection to the datatbase, and managing a connection pool
engine = create_engine(DATABASE_URL)

# SessionLocal is an instance (object) of the sessionmaker class
# This is what's going to issue out Session objects when a connection to the database is required
SessionLocal = sessionmaker(autoflush=False, bind=engine)

# Base will inherit from DeclarativeBase, which is responsible for the actual model classes (this simple inherit puts things in motion)
# Without it, SQLAlchemy wouldn't know the structure of our tables (the structure will be placed in models.py)
class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal() # Create a Session object
    try:
        yield db # FastAPI will deal with moving this yield along
    finally:
        db.close() # Close the connection