import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

const Ctx = createContext(null)

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const triggerRef = useRef(null)

  const ctx = {
    value, onValueChange,
    open, setOpen,
    label, setLabel,
    placeholder, setPlaceholder,
    triggerRef,
  }
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function SelectTrigger({ className='', children }) {
  const { open, setOpen, label, placeholder, triggerRef } = useContext(Ctx)
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      className={`w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm flex items-center justify-between ${className}`}
    >
      <span className="truncate text-left">{label || placeholder || ''}</span>
      <span className="ml-2 text-zinc-500">▾</span>
      {/* Render children (e.g., <SelectValue />) but hide visually */}
      <span className="hidden">{children}</span>
    </button>
  )
}

export function SelectValue({ placeholder }) {
  const { setPlaceholder } = useContext(Ctx)
  useEffect(() => {
    setPlaceholder(placeholder || 'Select')
  }, [placeholder, setPlaceholder])
  return null
}

export function SelectContent({ children }) {
  const { open, setOpen, triggerRef } = useContext(Ctx)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  useEffect(() => {
    const el = triggerRef.current
    if (el) {
      const r = el.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width })
    }
  }, [open, triggerRef])
  if (!open) return null
  return (
    <div
      style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 50 }}
      className="bg-white border border-zinc-200 rounded-xl shadow-lg max-h-64 overflow-auto"
    >
      {children}
      <div className="p-1"></div>
      <div onClick={() => setOpen(false)} className="hidden" />
    </div>
  )
}

export function SelectItem({ value, children }) {
  const { onValueChange, setOpen, setLabel } = useContext(Ctx)
  return (
    <div
      role="option"
      tabIndex={0}
      onClick={() => { onValueChange && onValueChange(value); setLabel(String(children)); setOpen(false) }}
      className="px-3 py-2 text-sm hover:bg-zinc-100 cursor-pointer"
    >
      {children}
    </div>
  )
}
