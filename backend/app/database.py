from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# pool_pre_ping: check a pooled connection is alive before using it (survives a DB restart)
engine = create_engine(settings.database_url, pool_pre_ping=True)
# expire_on_commit=False: objects keep their values after commit, no hidden reload queries
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    # One session per request. Routers commit explicitly;
    # leaving the block closes the session and rolls back anything uncommitted.
    with SessionLocal() as db:
        yield db
