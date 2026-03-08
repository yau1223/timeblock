# 認證業務邏輯服務層：密碼雜湊、JWT 產生/驗證、使用者查詢
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.config import settings


def hash_password(password: str) -> str:
    """將明文密碼雜湊為 bcrypt 格式（使用 bcrypt 直接操作，相容 bcrypt 5.x）"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """驗證明文密碼是否與雜湊值相符"""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    """產生含使用者 ID 的 JWT access token，有效期限依設定值"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> str:
    """解碼 JWT token，回傳使用者 ID；token 無效或過期時拋出 JWTError"""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    user_id: str = payload.get("sub")
    if user_id is None:
        raise JWTError("token 中缺少 sub 欄位")
    return user_id


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """透過 email 查詢使用者，不存在時回傳 None"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, password: str, name: str) -> User:
    """建立新的本地帳號使用者，密碼自動雜湊後儲存；email 重複時拋出 ValueError"""
    user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
        auth_provider="local",
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        # email 唯一約束衝突（高並發 race condition 保護）
        await db.rollback()
        raise ValueError(f"Email {email} 已被使用")
    await db.refresh(user)
    return user
