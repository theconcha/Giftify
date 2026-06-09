import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface ComboboxOption {
  value: string
  label: string
}

interface Props {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function Combobox({ options, value, onChange, placeholder, className }: Props) {
  const labelForValue = (v: string) => options.find(o => o.value === v)?.label ?? ''
  const [inputText, setInputText] = useState(labelForValue(value))
  const [open, setOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync display label when external value changes
  useEffect(() => {
    if (!isFocused) setInputText(labelForValue(value))
  }, [value, options])

  // While focused and typing, filter by label (contains) or value — otherwise show all
  // Trailing space = exact value match ("1 " → only January); no space = prefix match ("1" → Jan/Oct/Nov/Dec)
  const query = inputText.trim().toLowerCase()
  const hasTrailingSpace = inputText !== inputText.trimEnd()
  const filtered = query && isFocused
    ? options.filter(o =>
        o.label.toLowerCase().includes(query) ||
        (hasTrailingSpace
          ? o.value.toLowerCase() === query
          : o.value.toLowerCase().startsWith(query))
      )
    : options

  const handleFocus = () => {
    setIsFocused(true)
    setInputText('') // clear so all options are immediately visible
    setOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    setOpen(true)
  }

  const handleSelect = (option: ComboboxOption) => {
    setInputText(option.label)
    setIsFocused(false)
    onChange(option.value)
    setOpen(false)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false)
      setOpen(false)
      // If typed text exactly matches an option label, select it
      const exactMatch = options.find(
        o => o.label.toLowerCase() === inputText.toLowerCase()
      )
      if (exactMatch) {
        onChange(exactMatch.value)
        setInputText(exactMatch.label)
      } else {
        // Revert to whatever was previously selected
        setInputText(labelForValue(value))
      }
    }, 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setIsFocused(false)
      setInputText(labelForValue(value))
    }
    if (e.key === 'Enter' && filtered.length === 1) {
      handleSelect(filtered[0])
      e.preventDefault()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] pointer-events-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#E8E0D8] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(option => (
            <button
              key={option.value}
              type="button"
              onMouseDown={() => handleSelect(option)}
              className="w-full text-left px-3 py-2 text-sm text-[#2D2420] hover:bg-[#F8F3EE] transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
