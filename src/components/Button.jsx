import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) {
  const baseClass = "font-headline font-bold transition-all duration-200 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2";
  
  const variants = {
    primary: "gradient-primary text-white shadow-card hover:shadow-card-hover",
    secondary: "bg-surface-container-lowest text-primary border border-primary/35 hover:bg-primary/5",
    ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low",
    outline: "bg-transparent text-primary border border-primary/45 hover:bg-primary/5"
  };
  
  const sizes = {
    sm: "py-3 px-5 text-sm",
    md: "py-4 px-6 text-base",
    lg: "py-5 px-8 text-lg"
  };
  
  return (
    <button 
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
