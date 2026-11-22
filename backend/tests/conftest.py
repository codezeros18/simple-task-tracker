import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app

# Same PostgreSQL server, separate database (tasks_test), so tests never touch dev data
test_engine = create_engine(settings.database_url.set(database=settings.test_postgres_db))
TestSessionLocal = sessionmaker(bind=test_engine, expire_on_commit=False)


@pytest.fixture(scope="session")
def db_engine():
    # Once per test run: rebuild the schema from the current models
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    test_engine.dispose()


def override_get_db():
    with TestSessionLocal() as db:
        yield db


@pytest.fixture
def client(db_engine):
    # Every test starts with an empty table and ids counting from 1
    with db_engine.begin() as conn:
        conn.execute(text("TRUNCATE tasks RESTART IDENTITY"))
    app.dependency_overrides[get_db] = override_get_db
    # No "with" block: the app lifespan does not run, so create_all never touches the dev database
    yield TestClient(app)
    app.dependency_overrides.clear()
