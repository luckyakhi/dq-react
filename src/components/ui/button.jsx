import React from 'react'

const base = "inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-medium border transition focus:outline-none focus:ring-2 focus:ring-offset-1";
const variants = {
  default: "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800",
  secondary: "bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200",
  outline: "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50",
}

export function Button({ variant='default', className='', children, ...props }) {
  const cls = `${base} ${variants[variant] || variants.default} ${className}`
  return <button className={cls} {...props}>{children}</button>
}
