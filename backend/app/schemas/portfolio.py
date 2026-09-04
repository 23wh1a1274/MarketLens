from pydantic import BaseModel, field_validator


class PortfolioCreate(BaseModel):
    symbol: str
    quantity: int
    average_buy_price: float

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, value: str) -> str:
        value = value.strip().upper()

        if not value:
            raise ValueError("Symbol cannot be empty")

        return value

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Quantity must be greater than 0")

        return value

    @field_validator("average_buy_price")
    @classmethod
    def validate_price(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Average buy price must be greater than 0")

        return value


class PortfolioUpdate(BaseModel):
    quantity: int
    average_buy_price: float