from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config.config import settings

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

# In production, turn Echo off
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"options": "-c timezone=utc"}
)

local_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = local_session()
    
    try:
        yield db
    finally:
        db.close()