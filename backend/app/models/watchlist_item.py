from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    __table_args__ = (
        UniqueConstraint(
            "watchlist_id",
            "symbol",
            name="uq_watchlist_symbol",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    watchlist_id: Mapped[int] = mapped_column(
        ForeignKey("watchlists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    symbol: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    added_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )