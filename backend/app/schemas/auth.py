# 認證相關的 Pydantic 資料驗證 schema
import uuid
from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    """使用者註冊請求資料"""
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    """使用者登入請求資料"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT Token 回應資料"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """使用者資訊回應資料（用於 /me 端點）"""
    id: str
    email: str
    name: str
    avatar_url: str | None
    auth_provider: str

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid_to_str(cls, v: object) -> str:
        """將 UUID 型別轉換為字串，相容 Pydantic v2"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return str(v)
