from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

from app.models import TaskStatus

# Whitespace is stripped before the length check, so "   " counts as empty
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Title
    description: Description = ""
    status: TaskStatus = TaskStatus.TODO


class TaskUpdate(BaseModel):
    """Partial update: every field is optional, but a field that is sent cannot be null."""

    model_config = ConfigDict(extra="forbid")

    title: Title | None = None
    description: Description | None = None
    status: TaskStatus | None = None

    @field_validator("title", "description", "status")
    @classmethod
    def reject_null(cls, value):
        # Defaults are not validated, so this only runs for fields the client actually sent
        if value is None:
            raise ValueError("may be omitted, but cannot be null")
        return value


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
