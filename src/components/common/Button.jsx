import React from 'react';

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary',
  secondary:
    'bg-secondary-DEFAULT text-primary-dark hover:bg-gray-300 focus-visible:ring-primary-dark',
  ghost:
    'bg-transparent text-secondary-darkest hover:bg-secondary-DEFAULT focus-visible:ring-gray-400',
  icon: 'p-2 text-secondary-darkest hover:bg-secondary-DEFAULT  focus-visible:ring-gray-300',
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center  border border-transparent
        px-4 py-2 text-sm font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        transition-colors duration-150
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}