from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.watchlist import Watchlist
from app.schemas.watchlist import WatchlistCreate, WatchlistResponse
from app.core.security import get_current_user
from app.models.watchlist_item import WatchlistItem
from app.schemas.watchlist import StockAdd, StockResponse

router = APIRouter(
    prefix="/api/watchlists",
    tags=["Watchlists"],
)


@router.post("", response_model=WatchlistResponse)
def create_watchlist(
    data: WatchlistCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    watchlist = Watchlist(
        user_id=user_id,
        name=data.name,
    )

    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)

    return watchlist


@router.get("", response_model=list[WatchlistResponse])
def get_watchlists(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Watchlist)
        .filter(Watchlist.user_id == user_id)
        .all()
    )


@router.delete("/{watchlist_id}")
def delete_watchlist(
    watchlist_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id,
        )
        .first()
    )

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found",
        )

    db.delete(watchlist)
    db.commit()

    return {"message": "Watchlist deleted"}
@router.post("/{watchlist_id}/stocks", response_model=StockResponse)
def add_stock(
    watchlist_id: int,
    data: StockAdd,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Make sure the watchlist belongs to the logged-in user
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id,
        )
        .first()
    )

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found",
        )

    symbol = data.symbol

    # Prevent duplicate stocks
    existing_stock = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == symbol,
        )
        .first()
    )

    if existing_stock:
        raise HTTPException(
            status_code=409,
            detail="Stock already exists in this watchlist",
        )

    stock = WatchlistItem(
        watchlist_id=watchlist_id,
        symbol=symbol,
    )

    db.add(stock)
    db.commit()
    db.refresh(stock)

    return stock


@router.get(
    "/{watchlist_id}/stocks",
    response_model=list[StockResponse],
)
def get_stocks(
    watchlist_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Make sure the watchlist belongs to the logged-in user
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id,
        )
        .first()
    )

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found",
        )

    return (
        db.query(WatchlistItem)
        .filter(WatchlistItem.watchlist_id == watchlist_id)
        .all()
    )


@router.delete("/{watchlist_id}/stocks/{symbol}")
def delete_stock(
    watchlist_id: int,
    symbol: str,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Make sure the watchlist belongs to the logged-in user
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id,
        )
        .first()
    )

    if not watchlist:
        raise HTTPException(
            status_code=404,
            detail="Watchlist not found",
        )

    symbol = symbol.strip().upper()

    stock = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == symbol,
        )
        .first()
    )

    if not stock:
        raise HTTPException(
            status_code=404,
            detail="Stock not found",
        )

    db.delete(stock)
    db.commit()

    return {"message": f"{symbol} removed from watchlist"}