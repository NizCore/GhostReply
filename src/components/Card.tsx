import React from 'react';
import { cn } from '@utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export function Card({
  className,
  variant = 'default',
  size = 'md',
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-bg-secondary border-border-color',
    primary: 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800',
    secondary: 'bg-secondary-100 border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700',
  };

  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'border rounded-xl transition-all duration-200',
        variants[variant],
        sizes[size],
        hoverable && 'hover:shadow-md hover:border-primary-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between mb-4 pb-4 border-b border-border-color', className)}
      {...props}
    >
      <div>
        {title && <h3 className="font-semibold text-text-primary">{title}</h3>}
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('', className)} {...props} />;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-border-color', className)}
      {...props}
    />
  );
}

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
