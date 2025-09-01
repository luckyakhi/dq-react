import React from 'react'

export function Input({ className='', ...props }) {
  const cls = `w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 ${className}`
  return <input className={cls} {...props} />
}
