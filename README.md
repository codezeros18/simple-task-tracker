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

## Troubleshooting

- **`env file .../backend/.env not found`**: the env file was not copied yet. Run the copy command from step 1.
- **Port 5433 is already in use**: change the left side of `"5433:5432"` in `docker-compose.yml` (for example `"5434:5432"`) and set the same number as `DB_PORT` in `backend/.env`.
- **`tasks_test` is missing, or you changed the credentials in `backend/.env`**: init scripts and credentials are only applied when the data volume is empty. Reset it (this deletes all data):

  ```bash
  docker compose down -v
  docker compose up -d --wait
  ```
