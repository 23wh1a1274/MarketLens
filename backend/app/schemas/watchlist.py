from pydantic import BaseModel, field_validator


class WatchlistCreate(BaseModel):
    name: str


class WatchlistResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class StockAdd(BaseModel):
    symbol: str

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, value: str) -> str:
        value = value.strip().upper()

        if not value:
            raise ValueError("Symbol cannot be empty")

        return value


class StockResponse(BaseModel):
    id: int
    symbol: str

    class Config:
        from_attributes = True