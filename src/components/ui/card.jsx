import React from 'react'

export function Card({ className = '', children, ...props }) {
  return <div className={`bg-white border border-zinc-200 rounded-2xl ${className}`} {...props}>{children}</div>
}
export function CardHeader({ className = '', children }) {
  return <div className={`px-4 pt-4 ${className}`}>{children}</div>
}
export function CardTitle({ className = '', children }) {
  return <div className={`text-base font-medium ${className}`}>{children}</div>
}
export function CardContent({ className = '', children }) {
  return <div className={`px-4 pb-4 ${className}`}>{children}</div>
}
