import React from 'react'

export function Dialog({ open, onOpenChange, children }) {
  // Wrap children; actual content renders conditionally inside DialogContent
  return <div data-open={open ? 'true' : 'false'}>{children}</div>
}

export function DialogContent({ className='', children }) {
  // Find 'open' from parent prop via React.Children? Simpler: always render overlay;
  // The parent controls its rendering with 'open' prop around usage.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" />
      <div className={`relative bg-white border border-zinc-200 rounded-2xl shadow-xl w-[90vw] max-w-xl ${className}`}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }) {
  return <div className="px-4 pt-4">{children}</div>
}

export function DialogTitle({ className='', children }) {
  return <div className={`text-lg font-medium ${className}`}>{children}</div>
}
