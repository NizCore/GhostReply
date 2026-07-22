import React, { forwardRef, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { cn } from '@utils/cn';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  emoji?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      hint,
      error,
      options,
      value,
      onChange,
      size = 'md',
      disabled,
      placeholder = 'Select an option',
      ...props
    },
    ref
  ) => {
    const [selectedValue, setSelectedValue] = useState(value || '');
    const selectRef = useRef<HTMLSelectElement>(null);

    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setSelectedValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    useEffect(() => {
      setSelectedValue(value || '');
    }, [value]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref || selectRef}
            value={selectedValue}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              'block w-full border border-border-color rounded-lg bg-bg-primary text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-200 appearance-none cursor-pointer',
              error && 'border-red-500 focus:ring-red-500',
              sizes[size],
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.emoji ? `${option.emoji} ${option.label}` : option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown
              className="h-4 w-4 text-text-secondary"
              size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
            />
          </div>
        </div>
        {hint && !error && (
          <p className="text-xs text-text-secondary mt-1">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface CustomSelectProps {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
}

export function CustomSelect({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  size = 'md',
  disabled,
  placeholder = 'Select an option',
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const preferredMaxHeight = 240;
    const gap = 4;

    const openUpward = spaceBelow < Math.min(preferredMaxHeight, 160) && spaceAbove > spaceBelow;
    const available = openUpward ? spaceAbove - gap - 8 : spaceBelow - gap - 8;
    const maxHeight = Math.max(120, Math.min(preferredMaxHeight, available));

    setPosition({
      top: openUpward ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUpward,
    });
  };

  const handleOptionClick = (optionValue: string) => {
    if (optionValue !== selectedValue) {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    updatePosition();

    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, options.length]);

  return (
    <div className={cn('w-full', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            'w-full flex items-center justify-between border border-border-color rounded-lg bg-bg-primary text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors duration-200 cursor-pointer',
            error && 'border-red-500 focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed',
            sizes[size],
            isOpen && 'ring-2 ring-primary-500 border-primary-500'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.emoji && <span>{selectedOption.emoji}</span>}
            {selectedOption?.icon && <span className="text-text-secondary">{selectedOption.icon}</span>}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-text-secondary transition-transform duration-200 flex-shrink-0',
              isOpen && 'transform rotate-180'
            )}
            size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
          />
        </button>

        {isOpen && position && (
          <div
            ref={menuRef}
            role="listbox"
            className="fixed z-[9999] bg-bg-secondary border border-border-color rounded-lg shadow-lg overflow-y-auto"
            style={{
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              top: position.openUpward ? undefined : position.top,
              bottom: position.openUpward
                ? window.innerHeight - position.top
                : undefined,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selectedValue === option.value}
                onClick={() => !option.disabled && handleOptionClick(option.value)}
                disabled={option.disabled}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors duration-150',
                  'dark:hover:bg-primary-900 dark:hover:text-primary-300',
                  selectedValue === option.value && 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.emoji && <span>{option.emoji}</span>}
                {option.icon && <span className="text-text-secondary">{option.icon}</span>}
                <span className="truncate">{option.label}</span>
                {selectedValue === option.value && (
                  <Check className="ml-auto h-4 w-4 text-primary-600 flex-shrink-0" size={16} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="text-xs text-text-secondary mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
