import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] hover:scale-[1.02]';
  
  const variants = {
    primary: 'btn-primary focus:ring-emerald-500',
    secondary: 'btn-secondary focus:ring-emerald-500',
    outline: 'border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 focus:ring-emerald-500',
    ghost: 'text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = props.disabled 
    ? 'opacity-75 cursor-not-allowed' 
    : '';
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      style={props.disabled ? { 
        color: variant === 'primary' ? 'white' : undefined,
        opacity: 0.9 
      } : {}}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
