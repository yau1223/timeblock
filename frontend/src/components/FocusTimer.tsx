// 專注計時器元件：顯示倒數並支援提早完成
import { useState, useEffect, useCallback } from 'react'

interface FocusTimerProps {
  /** 時間塊結束時間（ISO 格式） */
  endTime: string
  /** 計時完成或手動完成時的回呼 */
  onComplete: () => void
}

/** 專注計時器：顯示倒數至時間塊結束，支援提早完成 */
export default function FocusTimer({ endTime, onComplete }: FocusTimerProps) {
  /** 計算距離結束時間的剩餘秒數 */
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
      if (r === 0) {
        clearInterval(id)
        onComplete()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [active, calcRemaining, onComplete])

  // 格式化剩餘時間為 mm:ss
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
      {active ? (
        <>
          <span className="text-xs font-mono text-white/90">{mm}:{ss}</span>
          <button
            onClick={onComplete}
            className="text-xs text-white/70 hover:text-white underline"
          >
            ✓ 完成
          </button>
        </>
      ) : (
        <button
          onClick={() => setActive(true)}
          className="text-xs text-white/70 hover:text-white"
        >
          ▶ 專注
        </button>
      )}
    </div>
  )
}
