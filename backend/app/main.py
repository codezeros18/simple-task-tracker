from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.config import settings
from app.database import Base, engine
from app.routers import tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates missing tables only; never alters existing ones (that needs migrations)
    Base.metadata.create_all(bind=engine)
    yield
    engine.dispose()


app = FastAPI(title="Simple Task Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


# Deliberately narrow: only "cannot reach the database" becomes 503.
# Other database errors are bugs and must surface as 500, not hide behind a friendly message.
@app.exception_handler(OperationalError)
async def database_unavailable(request: Request, exc: OperationalError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "Database unavailable"})


app.include_router(tasks.router)
