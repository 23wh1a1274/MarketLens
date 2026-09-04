from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class UserEvent(Base):
    __tablename__ = "user_events"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    event_id: Mapped[int] = mapped_column(
        ForeignKey("market_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    seen_at: Mapped[datetime | None] = mapped_column(
        DateTime,
    )

    dismissed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
    )