from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return str(value).lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError(
                "Password must not exceed 72 bytes."
            )

        if not any(character.isalpha() for character in value):
            raise ValueError(
                "Password must contain at least one letter."
            )

        if not any(character.isdigit() for character in value):
            raise ValueError(
                "Password must contain at least one number."
            )

        return value


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserLogin(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=1, max_length=72)

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return str(value).lower()

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    price_paise: int
    images: list[str]
    sizes: list[str]
    colour: str
    stock: int
    is_featured: bool

    model_config = ConfigDict(from_attributes=True)

class CartAdd(BaseModel):
    product_id: int = Field(gt=0)
    size: str = Field(min_length=1, max_length=20)
    quantity: int = Field(default=1, ge=1, le=99)

    @field_validator("size", mode="before")
    @classmethod
    def clean_size(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value


class CartUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartItemResponse(BaseModel):
    id: int
    product: ProductResponse
    size: str
    quantity: int
    subtotal_paise: int


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_quantity: int
    total_paise: int

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    size: str
    quantity: int
    unit_price_paise: int
    subtotal_paise: int

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    status: str
    total_paise: int
    currency: str
    created_at: datetime
    paid_at: datetime | None
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)

class PaymentIntentResponse(BaseModel):
    order_id: int
    payment_intent_id: str
    client_secret: str
    publishable_key: str
    payment_status: str