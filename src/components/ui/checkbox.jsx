import React from 'react'

export function Checkbox({ id, checked, onCheckedChange }) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300"
    />
  )
}
