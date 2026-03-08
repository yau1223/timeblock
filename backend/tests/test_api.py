# FastAPI API 端點整合測試
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """健康檢查端點應回傳 200 與 ok 狀態"""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_register_new_user(client: AsyncClient):
    """新使用者註冊應成功並回傳 access_token"""
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "測試使用者",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """重複 email 註冊應回傳 400"""
    payload = {"email": "dup@example.com", "password": "pw123", "name": "使用者"}
    await client.post("/api/auth/register", json=payload)
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """正確帳密登入應回傳 access_token"""
    await client.post("/api/auth/register", json={
        "email": "login@example.com", "password": "pw123", "name": "使用者",
    })
    response = await client.post("/api/auth/login", json={
        "email": "login@example.com", "password": "pw123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """錯誤密碼登入應回傳 401"""
    await client.post("/api/auth/register", json={
        "email": "err@example.com", "password": "correct", "name": "使用者",
    })
    response = await client.post("/api/auth/login", json={
        "email": "err@example.com", "password": "wrong",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """不存在的帳號登入應回傳 401"""
    response = await client.post("/api/auth/login", json={
        "email": "noexist@example.com", "password": "pw123",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_requires_auth(client: AsyncClient):
    """/me 端點需要 Bearer token，無 token 應回傳 401 (FastAPI HTTPBearer 預設行為)"""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_with_token(client: AsyncClient):
    """帶有效 token 呼叫 /me 應回傳使用者資訊"""
    reg = await client.post("/api/auth/register", json={
        "email": "me@example.com", "password": "pw123", "name": "我的帳號",
    })
    token = reg.json()["access_token"]
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_create_time_block(client: AsyncClient):
    """已登入使用者可以新增時間塊"""
    reg = await client.post("/api/auth/register", json={
        "email": "block@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post("/api/blocks/", headers=headers, json={
        "title": "深度工作",
        "start_time": "2026-03-06T09:00:00Z",
        "end_time": "2026-03-06T11:00:00Z",
        "color": "#6366f1",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "深度工作"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_blocks_by_date(client: AsyncClient):
    """依日期查詢時間塊應只回傳該日的塊"""
    reg = await client.post("/api/auth/register", json={
        "email": "list@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 新增一個時間塊
    await client.post("/api/blocks/", headers=headers, json={
        "title": "測試",
        "start_time": "2026-03-06T09:00:00Z",
        "end_time": "2026-03-06T10:00:00Z",
    })

    response = await client.get("/api/blocks/?date=2026-03-06", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_list_blocks_by_range(client: AsyncClient):
    """依時間範圍查詢時間塊"""
    reg = await client.post("/api/auth/register", json={
        "email": "range@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/blocks/", headers=headers, json={
        "title": "範圍測試",
        "start_time": "2026-03-06T09:00:00Z",
        "end_time": "2026-03-06T10:00:00Z",
    })

    response = await client.get(
        "/api/blocks/?start=2026-03-06T00:00:00Z&end=2026-03-06T23:59:59Z",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_list_blocks_no_filter(client: AsyncClient):
    """無篩選條件查詢應回傳所有使用者的時間塊"""
    reg = await client.post("/api/auth/register", json={
        "email": "nofilter@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/blocks/", headers=headers, json={
        "title": "無篩選",
        "start_time": "2026-03-06T09:00:00Z",
        "end_time": "2026-03-06T10:00:00Z",
    })

    response = await client.get("/api/blocks/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_update_time_block(client: AsyncClient):
    """已登入使用者可以更新時間塊標題"""
    reg = await client.post("/api/auth/register", json={
        "email": "update@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    block = await client.post("/api/blocks/", headers=headers, json={
        "title": "原始標題",
        "start_time": "2026-03-06T09:00:00Z",
        "end_time": "2026-03-06T10:00:00Z",
    })
    block_id = block.json()["id"]

    response = await client.patch(f"/api/blocks/{block_id}", headers=headers, json={
        "title": "修改後標題",
    })
    assert response.status_code == 200
    assert response.json()["title"] == "修改後標題"


@pytest.mark.asyncio
async def test_update_time_block_invalid_time(client: AsyncClient):
    """更新時間塊若結束時間早於開始時間應回傳 422"""
    reg = await client.post("/api/auth/register", json={
        "email": "invtime@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    block = await client.post("/api/blocks/", headers=headers, json={
        "title": "時間測試",
        "start_time": "2026-03-06T09:00:00Z",
        "end_time": "2026-03-06T10:00:00Z",
    })
    block_id = block.json()["id"]

    response = await client.patch(f"/api/blocks/{block_id}", headers=headers, json={
        "start_time": "2026-03-06T11:00:00Z",
        "end_time": "2026-03-06T09:00:00Z",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_nonexistent_block(client: AsyncClient):
    """更新不存在的時間塊應回傳 404"""
    reg = await client.post("/api/auth/register", json={
        "email": "notfound@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = "00000000-0000-0000-0000-000000000001"
    response = await client.patch(f"/api/blocks/{fake_id}", headers=headers, json={
        "title": "不存在",
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_time_block(client: AsyncClient):
    """已登入使用者可以刪除自己的時間塊"""
    reg = await client.post("/api/auth/register", json={
        "email": "del@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    block = await client.post("/api/blocks/", headers=headers, json={
        "title": "要刪除的",
        "start_time": "2026-03-06T09:00:00Z",
        "end_time": "2026-03-06T10:00:00Z",
    })
    block_id = block.json()["id"]

    response = await client.delete(f"/api/blocks/{block_id}", headers=headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_block(client: AsyncClient):
    """刪除不存在的時間塊應回傳 404"""
    reg = await client.post("/api/auth/register", json={
        "email": "delnf@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = "00000000-0000-0000-0000-000000000002"
    response = await client.delete(f"/api/blocks/{fake_id}", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_habit(client: AsyncClient):
    """已登入使用者可以新增習慣"""
    reg = await client.post("/api/auth/register", json={
        "email": "habit@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post("/api/habits/", headers=headers, json={
        "title": "晨跑",
        "color": "#10b981",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "晨跑"
    assert data["streak"] == 0


@pytest.mark.asyncio
async def test_list_habits(client: AsyncClient):
    """已登入使用者可以列出所有習慣"""
    reg = await client.post("/api/auth/register", json={
        "email": "listhabit@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/habits/", headers=headers, json={"title": "冥想"})
    response = await client.get("/api/habits/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_update_habit(client: AsyncClient):
    """已登入使用者可以更新習慣標題"""
    reg = await client.post("/api/auth/register", json={
        "email": "updatehabit@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    habit = await client.post("/api/habits/", headers=headers, json={"title": "原始習慣"})
    habit_id = habit.json()["id"]

    response = await client.patch(f"/api/habits/{habit_id}", headers=headers, json={
        "title": "更新後習慣",
    })
    assert response.status_code == 200
    assert response.json()["title"] == "更新後習慣"


@pytest.mark.asyncio
async def test_update_nonexistent_habit(client: AsyncClient):
    """更新不存在的習慣應回傳 404"""
    reg = await client.post("/api/auth/register", json={
        "email": "habnotfound@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = "00000000-0000-0000-0000-000000000003"
    response = await client.patch(f"/api/habits/{fake_id}", headers=headers, json={
        "title": "不存在",
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_habit(client: AsyncClient):
    """已登入使用者可以軟刪除習慣"""
    reg = await client.post("/api/auth/register", json={
        "email": "delhabit@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    habit = await client.post("/api/habits/", headers=headers, json={"title": "要刪除的習慣"})
    habit_id = habit.json()["id"]

    response = await client.delete(f"/api/habits/{habit_id}", headers=headers)
    assert response.status_code == 204

    # 軟刪除後列表中不應再出現
    list_resp = await client.get("/api/habits/", headers=headers)
    assert all(h["id"] != habit_id for h in list_resp.json())


@pytest.mark.asyncio
async def test_delete_nonexistent_habit(client: AsyncClient):
    """刪除不存在的習慣應回傳 404"""
    reg = await client.post("/api/auth/register", json={
        "email": "delnfhabit@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = "00000000-0000-0000-0000-000000000004"
    response = await client.delete(f"/api/habits/{fake_id}", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_toggle_habit_log(client: AsyncClient):
    """打勾習慣應更新完成狀態"""
    reg = await client.post("/api/auth/register", json={
        "email": "toggle@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    habit = await client.post("/api/habits/", headers=headers, json={"title": "冥想"})
    habit_id = habit.json()["id"]

    # 第一次打勾
    response = await client.post(f"/api/habits/{habit_id}/logs/2026-03-06", headers=headers)
    assert response.status_code == 200
    assert response.json()["completed"] is True

    # 第二次取消
    response = await client.post(f"/api/habits/{habit_id}/logs/2026-03-06", headers=headers)
    assert response.json()["completed"] is False


@pytest.mark.asyncio
async def test_toggle_nonexistent_habit_log(client: AsyncClient):
    """對不存在習慣打勾應回傳 404"""
    reg = await client.post("/api/auth/register", json={
        "email": "togglenf@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = "00000000-0000-0000-0000-000000000005"
    response = await client.post(f"/api/habits/{fake_id}/logs/2026-03-06", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_habit_streak(client: AsyncClient):
    """取得習慣 streak 應回傳整數"""
    reg = await client.post("/api/auth/register", json={
        "email": "streak@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    habit = await client.post("/api/habits/", headers=headers, json={"title": "streak 測試"})
    habit_id = habit.json()["id"]

    response = await client.get(f"/api/habits/{habit_id}/streak", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), int)


@pytest.mark.asyncio
async def test_get_streak_nonexistent_habit(client: AsyncClient):
    """取得不存在習慣的 streak 應回傳 404"""
    reg = await client.post("/api/auth/register", json={
        "email": "streaknf@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = "00000000-0000-0000-0000-000000000006"
    response = await client.get(f"/api/habits/{fake_id}/streak", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_block_has_completed_at_field(client: AsyncClient):
    """新增時間塊後，回應資料應包含 completed_at 欄位且預設為 None"""
    # 先建立使用者並取得 token
    reg = await client.post("/api/auth/register", json={
        "email": "completed_at@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post("/api/blocks/", json={
        "title": "測試",
        "start_time": "2026-03-08T09:00:00Z",
        "end_time": "2026-03-08T10:00:00Z",
        "color": "#6366f1",
    }, headers=headers)
    assert res.status_code == 201
    assert "completed_at" in res.json()
    assert res.json()["completed_at"] is None


@pytest.mark.asyncio
async def test_mark_block_completed(client: AsyncClient):
    """已登入使用者可以透過 PATCH 設定 completed_at 標記時間塊為完成"""
    reg = await client.post("/api/auth/register", json={
        "email": "markdone@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 建立時間塊
    create_res = await client.post("/api/blocks/", json={
        "title": "測試完成",
        "start_time": "2026-03-08T09:00:00Z",
        "end_time": "2026-03-08T10:00:00Z",
        "color": "#6366f1",
    }, headers=headers)
    assert create_res.status_code == 201
    block_id = create_res.json()["id"]

    # 標記為完成
    patch_res = await client.patch(f"/api/blocks/{block_id}", json={
        "completed_at": "2026-03-08T09:45:00Z",
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["completed_at"] is not None


@pytest.mark.asyncio
async def test_unmark_block_completed(client: AsyncClient):
    """已登入使用者可以將 completed_at 設為 None 取消完成狀態"""
    reg = await client.post("/api/auth/register", json={
        "email": "undone@example.com", "password": "pw123", "name": "使用者",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 建立時間塊
    create_res = await client.post("/api/blocks/", json={
        "title": "取消完成測試",
        "start_time": "2026-03-08T09:00:00Z",
        "end_time": "2026-03-08T10:00:00Z",
        "color": "#6366f1",
    }, headers=headers)
    block_id = create_res.json()["id"]

    # 先標記完成
    await client.patch(f"/api/blocks/{block_id}", json={
        "completed_at": "2026-03-08T09:45:00Z",
    }, headers=headers)

    # 再取消完成（傳 null）
    patch_res = await client.patch(f"/api/blocks/{block_id}", json={
        "completed_at": None,
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["completed_at"] is None


@pytest.mark.asyncio
async def test_blocks_require_auth(client: AsyncClient):
    """未認證存取 blocks API 應回傳 401 (FastAPI HTTPBearer 預設行為)"""
    response = await client.get("/api/blocks/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_habits_require_auth(client: AsyncClient):
    """未認證存取 habits API 應回傳 401 (FastAPI HTTPBearer 預設行為)"""
    response = await client.get("/api/habits/")
    assert response.status_code == 401
