from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    symbol: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
    )

    open: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 4),
    )

    high: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 4),
    )

    low: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 4),
    )

    previous_close: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 4),
    )

    volume: Mapped[int | None] = mapped_column(
        BigInteger,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        index=True,
        nullable=False,
    )

    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )