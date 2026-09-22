import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glassmorphism?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = true,
  glassmorphism = true,
  className = '',
  ...props
}) => {
  const baseStyle = 'border border-slate-800 rounded-2xl p-6 transition-all duration-300'
  const bgStyle = glassmorphism 
    ? 'bg-slate-900/60 backdrop-blur-md border-slate-800/80 shadow-xl' 
    : 'bg-slate-800 border-slate-700 shadow-lg'
  const hoverStyle = hoverEffect 
    ? 'hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/5' 
    : ''

  return (
    <div
      className={`${baseStyle} ${bgStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
