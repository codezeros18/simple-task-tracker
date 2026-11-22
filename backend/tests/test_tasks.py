from datetime import datetime

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError


def test_list_tasks_empty_then_filled(client):
    assert client.get("/tasks").json() == []

    client.post("/tasks", json={"title": "First"})
    assert [t["title"] for t in client.get("/tasks").json()] == ["First"]

    client.post("/tasks", json={"title": "Second"})
    assert [t["title"] for t in client.get("/tasks").json()] == ["Second", "First"]


def test_create_task_returns_201_with_defaults(client):
    response = client.post("/tasks", json={"title": "Buy milk"})

    assert response.status_code == 201
    task = response.json()
    assert isinstance(task["id"], int)
    assert task["title"] == "Buy milk"
    assert task["description"] == ""
    assert task["status"] == "Todo"
    assert task["created_at"] is not None
    assert task["updated_at"] is not None


def test_create_strips_title_whitespace(client):
    response = client.post("/tasks", json={"title": "  Buy milk  "})

    assert response.status_code == 201
    assert response.json()["title"] == "Buy milk"


@pytest.mark.parametrize("title", ["", "   "])
def test_create_rejects_blank_title(client, title):
    response = client.post("/tasks", json={"title": title})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "title"]


@pytest.mark.parametrize("status", ["Selesai", "todo", "In  Progress"])
def test_create_rejects_invalid_status(client, status):
    response = client.post("/tasks", json={"title": "Buy milk", "status": status})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "enum"


def test_create_rejects_unknown_field(client):
    response = client.post("/tasks", json={"title": "Buy milk", "priority": "high"})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "extra_forbidden"


def test_update_changes_only_sent_fields(client):
    created = client.post("/tasks", json={"title": "Buy milk", "description": "2 liters"}).json()

    response = client.put(f"/tasks/{created['id']}", json={"status": "Done"})

    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "Done"
    assert updated["title"] == "Buy milk"
    assert updated["description"] == "2 liters"
    assert datetime.fromisoformat(updated["updated_at"]) > datetime.fromisoformat(
        created["updated_at"]
    )


def test_update_rejects_null_title(client):
    created = client.post("/tasks", json={"title": "Buy milk"}).json()

    response = client.put(f"/tasks/{created['id']}", json={"title": None})

    assert response.status_code == 422


@pytest.mark.parametrize("method", ["PUT", "DELETE"])
def test_missing_task_returns_404(client, method):
    body = {"status": "Done"} if method == "PUT" else None

    response = client.request(method, "/tasks/999", json=body)

    assert response.status_code == 404
    assert response.json() == {"detail": "Task not found"}


def test_delete_returns_204_then_404(client):
    created = client.post("/tasks", json={"title": "Buy milk"}).json()

    first = client.delete(f"/tasks/{created['id']}")
    assert first.status_code == 204
    assert first.content == b""

    assert client.delete(f"/tasks/{created['id']}").status_code == 404
    assert client.get("/tasks").json() == []


def test_list_filter_by_status(client):
    client.post("/tasks", json={"title": "Write docs"})
    client.post("/tasks", json={"title": "Set up CI", "status": "Done"})

    done = client.get("/tasks", params={"status": "Done"})
    assert done.status_code == 200
    assert [t["title"] for t in done.json()] == ["Set up CI"]

    assert client.get("/tasks", params={"status": "done"}).status_code == 422


def test_db_check_constraint_blocks_bad_status(db_engine):
    # Bypasses the API on purpose: the database itself must reject an unknown status
    with pytest.raises(IntegrityError, match="ck_tasks_status"), db_engine.begin() as conn:
        conn.execute(text("INSERT INTO tasks (title, status) VALUES ('Buy milk', 'Selesai')"))


def test_cors_preflight_allows_frontend_origin(client):
    preflight_headers = {
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type",
    }

    allowed = client.options(
        "/tasks/1", headers={"Origin": "http://localhost:5173", **preflight_headers}
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"

    blocked = client.options(
        "/tasks/1", headers={"Origin": "http://evil.example", **preflight_headers}
    )
    assert blocked.status_code == 400
    assert "access-control-allow-origin" not in blocked.headers
