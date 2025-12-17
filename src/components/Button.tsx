import React from 'react'
import { classNames } from '@/styles/tokens'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'font-medium rounded-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50'

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/80 active:bg-primary/70',
    secondary: 'bg-surface text-light hover:bg-dark active:bg-dark/80',
    outline: 'border border-light text-light hover:bg-white/10 active:bg-white/20',
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <button
      className={classNames(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
