# 認證服務單元測試：密碼雜湊與 JWT token 操作
import pytest
from app.services.auth import hash_password, verify_password, create_access_token, decode_token
from jose import JWTError


def test_hash_password_produces_different_hashes_each_time():
    """相同密碼每次雜湊結果應不同（salt 機制）"""
    hash1 = hash_password("mypassword123")
    hash2 = hash_password("mypassword123")
    assert hash1 != hash2


def test_verify_password_correct_password():
    """正確密碼驗證應回傳 True"""
    hashed = hash_password("mypassword123")
    assert verify_password("mypassword123", hashed) is True


def test_verify_password_wrong_password():
    """錯誤密碼驗證應回傳 False"""
    hashed = hash_password("mypassword123")
    assert verify_password("wrongpassword", hashed) is False


def test_create_and_decode_token_roundtrip():
    """JWT token 建立與解碼應正確保留 user_id"""
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_access_token(user_id)
    decoded_id = decode_token(token)
    assert decoded_id == user_id


def test_decode_invalid_token_raises_error():
    """無效 token 解碼應拋出 JWTError"""
    with pytest.raises(JWTError):
        decode_token("this.is.not.a.valid.jwt")


def test_decode_token_with_invalid_sub_format():
    """decode_token 對非 UUID 格式的 sub 也應成功解碼（UUID 驗證在 dependencies 層進行）"""
    # 此測試確認 decode_token 本身不驗證 UUID 格式，職責分離
    from jose import jwt
    from app.config import settings
    import time
    payload = {"sub": "not-a-uuid", "exp": int(time.time()) + 3600}
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    # decode_token 應能正常解碼，回傳非 UUID 字串
    result = decode_token(token)
    assert result == "not-a-uuid"
