import React from 'react'

export function Pagination({ children }) {
  return <nav className="w-full flex justify-center">{children}</nav>
}
export function PaginationContent({ children }) {
  return <div className="inline-flex items-center gap-1">{children}</div>
}
export function PaginationItem({ children }) {
  return <div>{children}</div>
}
export function PaginationPrevious({ className='', 'aria-disabled': ariaDisabled, onClick }) {
  return <button disabled={ariaDisabled} onClick={onClick} className={`px-2 py-1 border rounded-lg text-sm ${className}`}>Prev</button>
}
export function PaginationNext({ className='', 'aria-disabled': ariaDisabled, onClick }) {
  return <button disabled={ariaDisabled} onClick={onClick} className={`px-2 py-1 border rounded-lg text-sm ${className}`}>Next</button>
}
export function PaginationLink({ isActive, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 border rounded-lg text-sm ${isActive ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-300'}`}
    >{children}</button>
  )
}
