# Enhanced TimeBlock Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 升級時間塊 app，加入並排佈局、拖曳建立多小時塊、習慣拖入時間軸、色盤、專注計時器、每日進度條、範本時間表。

**Architecture:** 前端重構 DayView 為並排佈局（習慣側邊欄 + 時間軸），用 dnd-kit 支援跨容器拖曳（習慣→時間軸）與長按拖曳建立時間塊；後端新增 `completed_at` 欄位與 `templates` 資料表。

**Tech Stack:** React 18, dnd-kit (@dnd-kit/core @dnd-kit/utilities), date-fns, FastAPI, SQLAlchemy, Alembic

---

## Task 1: 後端 — TimeBlock 加 completed_at 欄位

**Files:**
- Modify: `backend/app/models/timeblock.py`
- Modify: `backend/app/schemas/block.py`
- Create: `backend/alembic/versions/xxxx_add_completed_at.py`
- Test: `backend/tests/test_blocks.py`

**Step 1: 修改 TimeBlock model 加欄位**

```python
# backend/app/models/timeblock.py 加入
from sqlalchemy import DateTime
completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

**Step 2: 修改 schema 支援 completed_at**

```python
# backend/app/schemas/block.py 的 TimeBlockResponse 加入
completed_at: datetime | None = None
```

**Step 3: 產生 migration**

```bash
cd backend
source .venv/bin/activate
alembic revision --autogenerate -m "add_completed_at_to_timeblocks"
```

**Step 4: 執行 migration**

```bash
alembic upgrade head
```

**Step 5: 寫測試確認欄位存在**

```python
# backend/tests/test_blocks.py
async def test_block_has_completed_at_field(client, auth_headers):
    res = await client.post("/api/blocks/", json={
        "title": "測試", "start_time": "2026-03-08T09:00:00Z",
        "end_time": "2026-03-08T10:00:00Z", "color": "#6366f1"
    }, headers=auth_headers)
    assert res.status_code == 201
    assert "completed_at" in res.json()
    assert res.json()["completed_at"] is None
```

**Step 6: 執行測試確認通過**

```bash
pytest tests/test_blocks.py -v
```

**Step 7: Commit**

```bash
git add backend/app/models/timeblock.py backend/app/schemas/block.py backend/alembic/versions/
git commit -m "feat: timeblock 新增 completed_at 欄位"
```

---

## Task 2: 後端 — 完成時間塊 API（PATCH completed_at）

**Files:**
- Modify: `backend/app/schemas/block.py`
- Modify: `backend/app/routers/blocks.py`
- Test: `backend/tests/test_blocks.py`

**Step 1: 更新 TimeBlockUpdate schema**

```python
# backend/app/schemas/block.py TimeBlockUpdate 加入
completed_at: datetime | None = None
```

**Step 2: 確認現有 PATCH endpoint 已支援（exclude_unset=True 已處理）**

現有 `PATCH /api/blocks/{block_id}` 使用 `exclude_unset=True`，直接支援 `completed_at` 更新，無需額外修改。

**Step 3: 寫測試**

```python
async def test_mark_block_completed(client, auth_headers):
    # 先建立時間塊
    create_res = await client.post("/api/blocks/", json={
        "title": "測試完成", "start_time": "2026-03-08T09:00:00Z",
        "end_time": "2026-03-08T10:00:00Z", "color": "#6366f1"
    }, headers=auth_headers)
    block_id = create_res.json()["id"]

    # 標記完成
    patch_res = await client.patch(f"/api/blocks/{block_id}", json={
        "completed_at": "2026-03-08T09:45:00Z"
    }, headers=auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["completed_at"] is not None
```

**Step 4: 執行測試**

```bash
pytest tests/test_blocks.py::test_mark_block_completed -v
```

**Step 5: Commit**

```bash
git add backend/app/schemas/block.py backend/tests/test_blocks.py
git commit -m "feat: 支援標記時間塊為完成（completed_at）"
```

---

## Task 3: 後端 — Templates CRUD

**Files:**
- Create: `backend/app/models/template.py`
- Create: `backend/app/schemas/template.py`
- Create: `backend/app/routers/templates.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/main.py`
- Create: `backend/alembic/versions/xxxx_add_templates.py`
- Test: `backend/tests/test_templates.py`

**Step 1: 建立 Template model**

```python
# backend/app/models/template.py
import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Template(Base):
    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    # 儲存時間塊陣列：[{title, color, offset_minutes, duration_minutes, habit_id?}]
    blocks: Mapped[list[Any]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="templates")
```

**Step 2: 在 User model 加入 relationship**

```python
# backend/app/models/user.py 加入
templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")
```

**Step 3: 建立 Template schemas**

```python
# backend/app/schemas/template.py
from datetime import datetime
from typing import Any
import uuid
from pydantic import BaseModel

class TemplateBlockItem(BaseModel):
    title: str
    color: str
    offset_minutes: int   # 從當日 00:00 起的分鐘偏移
    duration_minutes: int
    habit_id: str | None = None

class TemplateCreate(BaseModel):
    name: str
    blocks: list[TemplateBlockItem]

class TemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    blocks: list[Any]
    created_at: datetime
    model_config = {"from_attributes": True}
```

**Step 4: 建立 templates router**

```python
# backend/app/routers/templates.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateResponse

router = APIRouter(prefix="/api/templates", tags=["templates"])

@router.get("/", response_model=list[TemplateResponse])
async def list_templates(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """取得目前使用者的所有範本"""
    result = await db.execute(select(Template).where(Template.user_id == current_user.id))
    return result.scalars().all()

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(body: TemplateCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """建立新範本"""
    t = Template(user_id=current_user.id, name=body.name, blocks=[b.model_dump() for b in body.blocks])
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """刪除指定範本"""
    result = await db.execute(select(Template).where(Template.id == template_id, Template.user_id == current_user.id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="範本不存在")
    await db.delete(t)
    await db.commit()
```

**Step 5: 在 models/__init__.py 和 main.py 註冊**

```python
# backend/app/models/__init__.py 加入
from .template import Template

# backend/app/main.py 加入
from app.routers import templates
app.include_router(templates.router)
```

**Step 6: 產生並執行 migration**

```bash
alembic revision --autogenerate -m "add_templates_table"
alembic upgrade head
```

**Step 7: 寫測試**

```python
# backend/tests/test_templates.py
async def test_create_and_list_template(client, auth_headers):
    res = await client.post("/api/templates/", json={
        "name": "工作日",
        "blocks": [{"title": "晨會", "color": "#6366f1", "offset_minutes": 540, "duration_minutes": 60}]
    }, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["name"] == "工作日"

    list_res = await client.get("/api/templates/", headers=auth_headers)
    assert len(list_res.json()) == 1
```

**Step 8: 執行測試，Commit**

```bash
pytest tests/test_templates.py -v
git add backend/app/models/template.py backend/app/schemas/template.py backend/app/routers/templates.py backend/alembic/versions/
git commit -m "feat: 新增 Templates CRUD API"
```

---

## Task 4: 前端 — 色盤元件

**Files:**
- Create: `frontend/src/components/ColorPicker.tsx`
- Test: `frontend/src/components/ColorPicker.test.tsx`

**Step 1: 建立 ColorPicker 元件**

```tsx
// frontend/src/components/ColorPicker.tsx
const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#6366f1', '#a855f7', '#ec4899', '#6b7280', '#1f2937',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

/** 10 色預設色盤選擇器 */
export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="選擇顏色">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
            value === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
```

**Step 2: 寫測試**

```tsx
// frontend/src/components/ColorPicker.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ColorPicker from './ColorPicker'

test('renders 10 color buttons', () => {
  render(<ColorPicker value="#ef4444" onChange={() => {}} />)
  expect(screen.getAllByRole('radio')).toHaveLength(10)
})

test('calls onChange with selected color', () => {
  const onChange = vi.fn()
  render(<ColorPicker value="#ef4444" onChange={onChange} />)
  fireEvent.click(screen.getByLabelText('#6366f1'))
  expect(onChange).toHaveBeenCalledWith('#6366f1')
})
```

**Step 3: 執行測試**

```bash
cd frontend && npm run test
```

**Step 4: Commit**

```bash
git add frontend/src/components/ColorPicker.tsx frontend/src/components/ColorPicker.test.tsx
git commit -m "feat: 新增 ColorPicker 元件（10 色預設色盤）"
```

---

## Task 5: 前端 — 每日進度條元件

**Files:**
- Create: `frontend/src/components/DailyProgress.tsx`
- Test: `frontend/src/components/DailyProgress.test.tsx`

**Step 1: 建立 DailyProgress 元件**

```tsx
// frontend/src/components/DailyProgress.tsx
import type { TimeBlock } from '../api/blocks'

interface DailyProgressProps {
  blocks: TimeBlock[]
}

/** 計算已排、已完成、空閒小時數並顯示三色進度條 */
export default function DailyProgress({ blocks }: DailyProgressProps) {
  const scheduledHours = blocks.reduce((sum, b) => {
    return sum + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000
  }, 0)

  const completedHours = blocks.filter(b => b.completed_at).reduce((sum, b) => {
    return sum + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000
  }, 0)

  const freeHours = Math.max(0, 24 - scheduledHours)
  const scheduledPct = Math.min(100, (scheduledHours / 24) * 100)
  const completedPct = Math.min(100, (completedHours / 24) * 100)

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-100">
      <div className="flex gap-4 text-xs text-gray-500 mb-1">
        <span className="text-blue-500">已排 {scheduledHours.toFixed(1)}h</span>
        <span className="text-green-500">完成 {completedHours.toFixed(1)}h</span>
        <span className="text-gray-400">空閒 {freeHours.toFixed(1)}h</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-blue-200 rounded-full" style={{ width: `${scheduledPct}%` }} />
        <div className="absolute inset-y-0 left-0 bg-green-400 rounded-full" style={{ width: `${completedPct}%` }} />
      </div>
    </div>
  )
}
```

**Step 2: 寫測試**

```tsx
// frontend/src/components/DailyProgress.test.tsx
import { render, screen } from '@testing-library/react'
import DailyProgress from './DailyProgress'

const mockBlocks = [
  { id: '1', title: 'A', color: '#6366f1', start_time: '2026-03-08T01:00:00Z', end_time: '2026-03-08T03:00:00Z', is_recurring: false, completed_at: '2026-03-08T03:00:00Z' },
  { id: '2', title: 'B', color: '#6366f1', start_time: '2026-03-08T04:00:00Z', end_time: '2026-03-08T06:00:00Z', is_recurring: false, completed_at: null },
]

test('shows scheduled and completed hours', () => {
  render(<DailyProgress blocks={mockBlocks} />)
  expect(screen.getByText(/已排 4.0h/)).toBeInTheDocument()
  expect(screen.getByText(/完成 2.0h/)).toBeInTheDocument()
})
```

**Step 3: 執行測試，Commit**

```bash
npm run test
git add frontend/src/components/DailyProgress.tsx frontend/src/components/DailyProgress.test.tsx
git commit -m "feat: 新增每日進度條元件"
```

---

## Task 6: 前端 — 長按拖曳建立時間塊

**Files:**
- Modify: `frontend/src/components/TimeAxis.tsx`
- Test: `frontend/src/components/TimeAxis.test.tsx`

**Step 1: 用 pointerdown/pointermove/pointerup 實作長按拖曳**

在 TimeAxis.tsx 新增以下邏輯（替換原本點擊 modal 觸發）：

```tsx
// 新增 state
const [dragStart, setDragStart] = useState<number | null>(null)  // 拖曳起始小時
const [dragEnd, setDragEnd] = useState<number | null>(null)      // 拖曳結束小時
const [isDragging, setIsDragging] = useState(false)

// pointerdown：記錄起始位置
const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  if ((e.target as HTMLElement).closest('[data-block]')) return
  const rect = e.currentTarget.getBoundingClientRect()
  const hour = Math.floor((e.clientY - rect.top) / HOUR_HEIGHT)
  setDragStart(hour)
  setDragEnd(hour)
  setIsDragging(false)
  e.currentTarget.setPointerCapture(e.pointerId)
}

// pointermove：更新拖曳範圍（移動超過 5px 才算拖曳）
const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (dragStart === null) return
  const rect = e.currentTarget.getBoundingClientRect()
  const hour = Math.min(23, Math.max(0, Math.floor((e.clientY - rect.top) / HOUR_HEIGHT)))
  if (Math.abs(hour - dragStart) >= 0) setIsDragging(true)
  setDragEnd(hour)
}

// pointerup：結束拖曳，顯示 modal（最少 30 分鐘 = 同一格也可）
const handlePointerUp = () => {
  if (dragStart === null) return
  const start = Math.min(dragStart, dragEnd ?? dragStart)
  const end = Math.max(dragStart, dragEnd ?? dragStart) + 1  // 至少 1 小時
  setClickedHour(start)
  setClickedEndHour(end)
  setShowModal(true)
  setDragStart(null)
  setDragEnd(null)
  setIsDragging(false)
}
```

並在 modal 送出時使用 `clickedEndHour` 計算結束時間。

**Step 2: 加入拖曳預覽 ghost block**

```tsx
// 拖曳中顯示半透明預覽塊
{isDragging && dragStart !== null && dragEnd !== null && (
  <div
    className="absolute left-14 right-2 rounded-lg bg-indigo-300/60 border-2 border-dashed border-indigo-500 pointer-events-none z-20"
    style={{
      top: Math.min(dragStart, dragEnd) * HOUR_HEIGHT,
      height: (Math.abs(dragEnd - dragStart) + 1) * HOUR_HEIGHT,
    }}
  />
)}
```

**Step 3: 寫基礎測試**

```tsx
// frontend/src/components/TimeAxis.test.tsx
test('renders 24 hour slots', () => {
  render(<TimeAxis date="2026-03-08" blocks={[]} onRefresh={() => {}} />)
  expect(screen.getAllByText(/^\d{2}:00$/)).toHaveLength(24)
})
```

**Step 4: 執行測試，Commit**

```bash
npm run test
git add frontend/src/components/TimeAxis.tsx frontend/src/components/TimeAxis.test.tsx
git commit -m "feat: 長按拖曳建立多小時時間塊，含預覽 ghost block"
```

---

## Task 7: 前端 — 新增時間塊 Modal 整合色盤

**Files:**
- Modify: `frontend/src/components/TimeAxis.tsx`

**Step 1: 在 modal 中加入色盤與 state**

```tsx
// TimeAxis.tsx 新增 state
const [selectedColor, setSelectedColor] = useState('#6366f1')

// modal 的 handleCreate 改用 selectedColor
const handleCreate = async () => {
  const startDate = new Date(`${date}T${String(clickedHour).padStart(2, '0')}:00:00`)
  const endDate = new Date(`${date}T${String(clickedEndHour).padStart(2, '0')}:00:00`)
  await createBlock({
    title: newTitle.trim() || '新時間塊',
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    color: selectedColor,
  })
  setShowModal(false)
  setNewTitle('')
  onRefresh()
}
```

在 modal 的 input 下方插入：
```tsx
<div className="mb-4">
  <p className="text-xs text-gray-500 mb-2">顏色</p>
  <ColorPicker value={selectedColor} onChange={setSelectedColor} />
</div>
```

**Step 2: 執行測試確認無 regression，Commit**

```bash
npm run test
git add frontend/src/components/TimeAxis.tsx
git commit -m "feat: 新增時間塊 modal 整合色盤選擇"
```

---

## Task 8: 前端 — 習慣側邊欄元件（可拖曳）

**Files:**
- Create: `frontend/src/components/HabitSidebar.tsx`
- Test: `frontend/src/components/HabitSidebar.test.tsx`

**Step 1: 建立可拖曳的習慣側邊欄**

```tsx
// frontend/src/components/HabitSidebar.tsx
import { useDraggable } from '@dnd-kit/core'
import type { Habit } from '../api/habits'

interface DraggableHabitProps {
  habit: Habit
}

/** 可拖曳的單一習慣列項 */
function DraggableHabitItem({ habit }: DraggableHabitProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `habit-${habit.id}`,
    data: { type: 'habit', habit },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? 'opacity-40' : 'hover:bg-gray-50'
      }`}
    >
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
      <span className="text-sm truncate">{habit.title}</span>
      <span className="text-xs text-gray-400 ml-auto">🔥{habit.streak}</span>
    </div>
  )
}

interface HabitSidebarProps {
  habits: Habit[]
  onAddHabit: () => void
}

/** 習慣側邊欄：顯示可拖曳的習慣列表 */
export default function HabitSidebar({ habits, onAddHabit }: HabitSidebarProps) {
  return (
    <div className="w-40 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">習慣</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {habits.map(h => <DraggableHabitItem key={h.id} habit={h} />)}
        {habits.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">尚無習慣</p>
        )}
      </div>
      <button
        onClick={onAddHabit}
        className="m-2 text-xs text-indigo-600 hover:text-indigo-800 py-1 border border-dashed border-indigo-300 rounded-lg"
      >
        + 新增習慣
      </button>
    </div>
  )
}
```

**Step 2: 寫測試**

```tsx
// frontend/src/components/HabitSidebar.test.tsx
import { render, screen } from '@testing-library/react'
import HabitSidebar from './HabitSidebar'

const mockHabits = [
  { id: '1', title: '晨跑', color: '#22c55e', streak: 3, today_completed: false },
]

test('renders habits list', () => {
  render(<HabitSidebar habits={mockHabits} onAddHabit={() => {}} />)
  expect(screen.getByText('晨跑')).toBeInTheDocument()
  expect(screen.getByText('🔥3')).toBeInTheDocument()
})

test('shows empty state when no habits', () => {
  render(<HabitSidebar habits={[]} onAddHabit={() => {}} />)
  expect(screen.getByText('尚無習慣')).toBeInTheDocument()
})
```

**Step 3: 執行測試，Commit**

```bash
npm run test
git add frontend/src/components/HabitSidebar.tsx frontend/src/components/HabitSidebar.test.tsx
git commit -m "feat: 新增可拖曳 HabitSidebar 元件"
```

---

## Task 9: 前端 — DayView 並排佈局 + 習慣拖入時間軸

**Files:**
- Modify: `frontend/src/pages/DayView.tsx`
- Modify: `frontend/src/components/TimeAxis.tsx`

**Step 1: 重構 DayView 為並排佈局**

```tsx
// frontend/src/pages/DayView.tsx 重構
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import HabitSidebar from '../components/HabitSidebar'
import DailyProgress from '../components/DailyProgress'
import { getHabits, createHabit, type Habit } from '../api/habits'
import { createBlock } from '../api/blocks'

// 在 DayView 中新增 habits state
const [habits, setHabits] = useState<Habit[]>([])
const [showAddHabit, setShowAddHabit] = useState(false)

// 在 useEffect 中同時載入習慣
useEffect(() => {
  refresh()
  getHabits().then(setHabits).catch(console.error)
}, [refresh])

// 處理習慣拖曳到時間軸
const handleDragEnd = async (event: any) => {
  const { active, over } = event
  if (!over || !active.data.current?.type === 'habit') return
  const habit = active.data.current.habit as Habit
  const dropHour = over.data.current?.hour as number
  if (dropHour === undefined) return

  const startDate = new Date(`${dateStr}T${String(dropHour).padStart(2, '0')}:00:00`)
  const endDate = new Date(startDate.getTime() + 3600000)
  await createBlock({
    title: habit.title,
    color: habit.color,
    habit_id: habit.id,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
  })
  refresh()
}
```

佈局結構：
```tsx
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  <div className="flex h-[calc(100vh-120px)]">
    <HabitSidebar habits={habits} onAddHabit={() => setShowAddHabit(true)} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <DailyProgress blocks={blocks} />
      <div className="flex-1 overflow-y-auto">
        <TimeAxis date={dateStr} blocks={blocks} onRefresh={refresh} />
      </div>
    </div>
  </div>
</DndContext>
```

**Step 2: TimeAxis 加入 droppable 每小時格**

```tsx
// 每小時格加入 useDroppable
import { useDroppable } from '@dnd-kit/core'

function HourSlot({ hour }: { hour: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour },
  })
  return (
    <div
      ref={setNodeRef}
      className={`absolute w-full border-t border-gray-100 transition-colors ${isOver ? 'bg-indigo-50' : ''}`}
      style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
    >
      <span className="absolute left-2 -top-2 text-xs text-gray-400 w-10 text-right">
        {String(hour).padStart(2, '0')}:00
      </span>
    </div>
  )
}
```

**Step 3: 執行測試確認無 regression，Commit**

```bash
npm run test
git add frontend/src/pages/DayView.tsx frontend/src/components/TimeAxis.tsx
git commit -m "feat: DayView 並排佈局，習慣可拖曳至時間軸"
```

---

## Task 10: 前端 — 專注計時器

**Files:**
- Create: `frontend/src/components/FocusTimer.tsx`
- Modify: `frontend/src/components/BlockCard.tsx`
- Test: `frontend/src/components/FocusTimer.test.tsx`

**Step 1: 建立 FocusTimer hook**

```tsx
// frontend/src/components/FocusTimer.tsx
import { useState, useEffect, useCallback } from 'react'

interface FocusTimerProps {
  endTime: string       // ISO 時間塊結束時間
  onComplete: () => void  // 完成回呼（呼叫 API 標記 completed_at）
}

/** 專注計時器：顯示倒數至時間塊結束，完成後通知 */
export default function FocusTimer({ endTime, onComplete }: FocusTimerProps) {
  const calcRemaining = useCallback(() => {
    return Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000))
  }, [endTime])

  const [seconds, setSeconds] = useState(calcRemaining)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      const r = calcRemaining()
      setSeconds(r)
      if (r === 0) { clearInterval(id); onComplete() }
    }, 1000)
    return () => clearInterval(id)
  }, [active, calcRemaining, onComplete])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-2 mt-1">
      {active ? (
        <>
          <span className="text-xs font-mono text-white/90">{mm}:{ss}</span>
          <button onClick={onComplete} className="text-xs text-white/70 hover:text-white">✓ 完成</button>
        </>
      ) : (
        <button onClick={() => setActive(true)} className="text-xs text-white/70 hover:text-white">▶ 專注</button>
      )}
    </div>
  )
}
```

**Step 2: 在 BlockCard 整合 FocusTimer**

```tsx
// BlockCard.tsx 加入
import FocusTimer from './FocusTimer'
import { updateBlock } from '../api/blocks'

// 標記完成
const handleComplete = async () => {
  await updateBlock(block.id, { completed_at: new Date().toISOString() })
}

// 在 BlockCard JSX 中加入（高度夠時顯示）
{heightPx > 40 && !block.completed_at && (
  <FocusTimer endTime={block.end_time} onComplete={handleComplete} />
)}
{block.completed_at && (
  <span className="text-xs text-white/70">✓ 已完成</span>
)}
```

**Step 3: 寫 FocusTimer 測試**

```tsx
// frontend/src/components/FocusTimer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import FocusTimer from './FocusTimer'

test('shows start button initially', () => {
  const endTime = new Date(Date.now() + 3600000).toISOString()
  render(<FocusTimer endTime={endTime} onComplete={() => {}} />)
  expect(screen.getByText('▶ 專注')).toBeInTheDocument()
})

test('shows timer after clicking start', () => {
  const endTime = new Date(Date.now() + 3600000).toISOString()
  render(<FocusTimer endTime={endTime} onComplete={() => {}} />)
  fireEvent.click(screen.getByText('▶ 專注'))
  expect(screen.getByText('✓ 完成')).toBeInTheDocument()
})
```

**Step 4: 執行測試，Commit**

```bash
npm run test
git add frontend/src/components/FocusTimer.tsx frontend/src/components/BlockCard.tsx frontend/src/components/FocusTimer.test.tsx
git commit -m "feat: 時間塊整合專注計時器，支援完成標記"
```

---

## Task 11: 前端 — 範本時間表頁面

**Files:**
- Create: `frontend/src/api/templates.ts`
- Create: `frontend/src/pages/TemplatesPage.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: 建立 templates API**

```ts
// frontend/src/api/templates.ts
import apiClient from './client'

export interface TemplateBlock {
  title: string; color: string; offset_minutes: number; duration_minutes: number; habit_id?: string
}
export interface Template {
  id: string; name: string; blocks: TemplateBlock[]; created_at: string
}

export async function getTemplates(): Promise<Template[]> {
  return (await apiClient.get('/api/templates/')).data
}
export async function createTemplate(data: { name: string; blocks: TemplateBlock[] }): Promise<Template> {
  return (await apiClient.post('/api/templates/', data)).data
}
export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/api/templates/${id}`)
}
```

**Step 2: 建立 TemplatesPage（含套用範本功能）**

```tsx
// frontend/src/pages/TemplatesPage.tsx 主要功能：
// 1. 列出所有範本
// 2. 點「套用」→ 選擇目標日期 → 批次建立時間塊（offset_minutes 轉成當日絕對時間）
// 3. 從當日排程「另存為範本」

// 套用範本的核心邏輯：
const applyTemplate = async (template: Template, targetDate: string) => {
  const dayStart = new Date(`${targetDate}T00:00:00`)
  await Promise.all(template.blocks.map(b => {
    const start = new Date(dayStart.getTime() + b.offset_minutes * 60000)
    const end = new Date(start.getTime() + b.duration_minutes * 60000)
    return createBlock({
      title: b.title, color: b.color,
      start_time: start.toISOString(), end_time: end.toISOString(),
      habit_id: b.habit_id,
    })
  }))
}
```

**Step 3: 在 App.tsx 加入路由**

```tsx
// frontend/src/App.tsx
import TemplatesPage from './pages/TemplatesPage'
// 在 Routes 中加入
<Route path="/templates" element={<TemplatesPage />} />
```

**Step 4: 在導覽列加入「範本」入口**（DayView、WeekView、MonthView、HabitsPage 的 nav 都加）

```tsx
<Link to="/templates" className="text-gray-500 hover:text-gray-900">範本</Link>
```

**Step 5: Commit**

```bash
git add frontend/src/api/templates.ts frontend/src/pages/TemplatesPage.tsx frontend/src/App.tsx
git commit -m "feat: 新增範本時間表頁面，支援儲存與套用範本"
```

---

## Task 12: 部署與 E2E 驗證

**Step 1: 推送至 GitHub（觸發自動部署）**

```bash
git push origin master
```

**Step 2: 確認 Render 重新部署成功**
- 前往 https://dashboard.render.com → timeblock-backend → Events
- 確認最新 deploy 狀態為 Live

**Step 3: 確認 Vercel 部署成功**
- 前往 https://vercel.com → timeblock → Deployments
- 確認最新 deployment 狀態為 Ready

**Step 4: 執行 E2E 測試**

```bash
cd frontend
npx playwright test --headed
```

關鍵驗證流程：
1. 登入後看到並排佈局（側邊欄 + 時間軸）
2. 在時間軸長按拖曳建立 2 小時時間塊，確認色盤可選色
3. 從習慣側邊欄拖曳習慣到時間軸，確認時間塊建立成功
4. 點擊時間塊「▶ 專注」，確認計時器啟動
5. 確認每日進度條反映正確數值
6. 建立範本，套用到另一天

**Step 5: 更新文件**

```bash
# 更新 README.md 加入新功能說明
git add README.md
git commit -m "docs: 更新 README 記錄新功能"
```
