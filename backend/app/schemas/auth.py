# 認證相關的 Pydantic 資料驗證 schema
from pydantic import BaseModel, EmailStr


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
