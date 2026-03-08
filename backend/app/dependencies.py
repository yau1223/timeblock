# FastAPI 依賴注入模組：Bearer token 驗證與目前使用者取得
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError
from app.database import get_db
from app.models.user import User
from app.services.auth import decode_token

# Bearer token 解析器（從 Authorization header 取得 token）
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """從 Bearer token 解析並查詢目前使用者，供路由作為依賴注入使用"""
    # 統一用 401 回應所有認證失敗，避免洩露資訊
    auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token 無效或已過期",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = decode_token(credentials.credentials)
        user_uuid = uuid.UUID(user_id)  # ValueError 若 sub 非合法 UUID
    except (JWTError, ValueError):
        raise auth_error
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        # 使用者已刪除但 token 仍有效，統一回傳 401
        raise auth_error
    return user
