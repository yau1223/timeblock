// 10 色預設色盤選擇器元件
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
