import React from 'react';
import { cn } from '@utils/cn';

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onCheckedChange,
  size = 'md',
  label,
  disabled,
  className,
  ...props
}: ToggleProps) {
  const sizes = {
    sm: 'w-8 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  };

  const dotSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        sizes[size],
        className
      )}
      {...props}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}}
        className="sr-only"
      />
      <span
        className={cn(
          'absolute inset-0 bg-secondary-200 rounded-full transition-colors duration-200',
          'dark:bg-secondary-700',
          checked && 'bg-primary-600'
        )}
      />
      <span
        className={cn(
          'absolute left-0.5 top-0.5 bg-white rounded-full shadow transition-transform duration-200',
          dotSizes[size],
          checked && `transform translate-x-${size === 'sm' ? '3.5' : size === 'md' ? '5' : '7'}`
        )}
      />
      {label && (
        <span className="ml-3 text-sm font-medium text-text-primary">
          {label}
        </span>
      )}
    </button>
  );
}
