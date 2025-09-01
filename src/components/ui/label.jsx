import React from 'react'
export function Label({ htmlFor, className='', children }) {
  return <label htmlFor={htmlFor} className={`block mb-1 ${className}`}>{children}</label>
}
