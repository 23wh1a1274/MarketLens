from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import PortfolioHolding
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate
from app.services.market_data import get_stock_snapshot


router = APIRouter(
    prefix="/api/portfolio",
    tags=["Portfolio"],
)


@router.post("")
def add_holding(
    data: PortfolioCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        get_stock_snapshot(data.symbol)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid or unsupported stock symbol: {data.symbol}",
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify stock symbol right now",
        )

    existing = (
        db.query(PortfolioHolding)
        .filter(
            PortfolioHolding.user_id == user_id,
            PortfolioHolding.symbol == data.symbol,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Stock already exists in portfolio",
        )

    holding = PortfolioHolding(
        user_id=user_id,
        symbol=data.symbol,
        quantity=data.quantity,
        average_buy_price=data.average_buy_price,
    )

    db.add(holding)
    db.commit()
    db.refresh(holding)

    return holding


@router.get("")
def get_portfolio(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    holdings = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.user_id == user_id)
        .order_by(PortfolioHolding.symbol.asc())
        .all()
    )

    results = []

    total_invested = 0.0
    total_current = 0.0

    for holding in holdings:
        try:
            market = get_stock_snapshot(holding.symbol)
            current_price = float(market["price"])
        except Exception:
            current_price = float(holding.average_buy_price)

        invested_value = (
            holding.quantity
            * float(holding.average_buy_price)
        )

        current_value = (
            holding.quantity
            * current_price
        )

        pnl = current_value - invested_value

        pnl_percent = (
            (pnl / invested_value) * 100
            if invested_value > 0
            else 0
        )

        total_invested += invested_value
        total_current += current_value

        results.append({
            "id": holding.id,
            "symbol": holding.symbol,
            "quantity": holding.quantity,
            "average_buy_price": float(
                holding.average_buy_price
            ),
            "current_price": current_price,
            "invested_value": round(invested_value, 2),
            "current_value": round(current_value, 2),
            "pnl": round(pnl, 2),
            "pnl_percent": round(pnl_percent, 2),
        })

    total_pnl = total_current - total_invested

    return {
        "holdings": results,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current": round(total_current, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_percent": round(
                (total_pnl / total_invested) * 100
                if total_invested > 0
                else 0,
                2,
            ),
        },
    }


@router.put("/{holding_id}")
def update_holding(
    holding_id: int,
    data: PortfolioUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    holding = (
        db.query(PortfolioHolding)
        .filter(
            PortfolioHolding.id == holding_id,
            PortfolioHolding.user_id == user_id,
        )
        .first()
    )

    if not holding:
        raise HTTPException(
            status_code=404,
            detail="Portfolio holding not found",
        )

    if data.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0",
        )

    if data.average_buy_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Average buy price must be greater than 0",
        )

    holding.quantity = data.quantity
    holding.average_buy_price = data.average_buy_price

    db.commit()
    db.refresh(holding)

    return holding


@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    holding = (
        db.query(PortfolioHolding)
        .filter(
            PortfolioHolding.id == holding_id,
            PortfolioHolding.user_id == user_id,
        )
        .first()
    )

    if not holding:
        raise HTTPException(
            status_code=404,
            detail="Portfolio holding not found",
        )

    db.delete(holding)
    db.commit()

    return {"message": "Holding removed"}