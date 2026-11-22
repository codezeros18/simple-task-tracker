# Simple Task Tracker

A small task board built with FastAPI, PostgreSQL and React for a technical test.

## Prerequisites

- Python 3.11+
- Node.js 22.12+ (24 LTS recommended)
- Docker Desktop, or a local PostgreSQL server
- Git

## Quick start

Run every command from the repository root unless a step says otherwise.

### 1. Start the database

macOS / Linux:

```bash
cp backend/.env.example backend/.env
docker compose up -d --wait        # starts PostgreSQL 18 and waits until it is healthy
```

Windows (PowerShell):

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up -d --wait
```

PostgreSQL listens on port **5433** on your machine (5432 inside the container), so it does not clash with a PostgreSQL you may already have on 5432.
On first start it also creates the `tasks_test` database used by the test suite.

Check that both databases exist:

```bash
docker compose exec db psql -U tasks_user -d tasks -c '\l'
```

The list should contain `tasks` and `tasks_test`.

### 2. Start the API

macOS / Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs on http://localhost:8000 and the interactive docs are at http://localhost:8000/docs.
The `tasks` table is created automatically on startup, so the database must be running first.
`uvicorn` keeps running in this terminal; leave it open and use a new terminal for the next steps.

## Setup without Docker

You need a local PostgreSQL server on port 5432. Create the user and both databases as a superuser
(on Linux, prefix each command with `sudo -u postgres`):

```bash
psql -d postgres -c "CREATE USER tasks_user WITH PASSWORD 'change-me';"
psql -d postgres -c "CREATE DATABASE tasks OWNER tasks_user;"
createdb -O tasks_user tasks_test
```

Then copy the env file as in step 1 and set `DB_PORT=5432` in `backend/.env`.
The password must match `POSTGRES_PASSWORD` in that file. The remaining steps are the same.

## Running tests

The tests run against the separate `tasks_test` database, so the database from step 1 must be running.
They never touch the `tasks` database you use while developing.

In a new terminal, from the repository root (on Windows, activate with `.venv\Scripts\Activate.ps1` instead):

```bash
cd backend
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest -v
```

## API reference

Base URL: `http://localhost:8000`. All bodies are JSON. Full schema: http://localhost:8000/docs.

| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| `GET` | `/tasks` | none; optional query `status` (`Todo`, `In Progress` or `Done`) | `200` list, newest first | `422`, `503` |
| `POST` | `/tasks` | `title` (required, 1–120 chars after trimming spaces), `description` (optional, up to 2000 chars), `status` (optional, default `Todo`) | `201` created task | `422`, `503` |
| `PUT` | `/tasks/{task_id}` | any of `title`, `description`, `status`; fields that are sent cannot be `null` | `200` updated task | `404`, `422`, `503` |
| `DELETE` | `/tasks/{task_id}` | none | `204` empty body | `404`, `422`, `503` |

- `404`: `{"detail": "Task not found"}`
- `422`: FastAPI's standard validation error, `{"detail": [...]}` with the failing field in `loc`
- `503`: `{"detail": "Database unavailable"}` when PostgreSQL cannot be reached
- Status values are case-sensitive. Unknown fields are rejected with `422`.

## Troubleshooting

- **`env file .../backend/.env not found`**: the env file was not copied yet. Run the copy command from step 1.
- **Port 5433 is already in use**: change the left side of `"5433:5432"` in `docker-compose.yml` (for example `"5434:5432"`) and set the same number as `DB_PORT` in `backend/.env`.
- **`tasks_test` is missing, or you changed the credentials in `backend/.env`**: init scripts and credentials are only applied when the data volume is empty. Reset it (this deletes all data):

  ```bash
  docker compose down -v
  docker compose up -d --wait
  ```
