from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, Identity, String, column, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TaskStatus(StrEnum):
    """The only place the allowed status values are defined."""

    TODO = "Todo"
    IN_PROGRESS = "In Progress"
    DONE = "Done"


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        # Built from TaskStatus, so the database rule can never drift from the API rule
        CheckConstraint(
            column("status", String).in_([s.value for s in TaskStatus]), name="ck_tasks_status"
        ),
    )

    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(2000), server_default="")
    status: Mapped[str] = mapped_column(String(20), server_default=TaskStatus.TODO)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # onupdate is applied by the ORM on UPDATE statements it issues, not by a DB trigger
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
