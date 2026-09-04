from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class MarketEvent(Base):
    __tablename__ = "market_events"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    symbol: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    old_value: Mapped[str | None] = mapped_column(
        Text,
    )

    new_value: Mapped[str | None] = mapped_column(
        Text,
    )

    reasons: Mapped[str | None] = mapped_column(
        Text,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        index=True,
        nullable=False,
    )