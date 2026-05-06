import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-10 bg-surface border border-border rounded-xl text-sm text-foreground',
            'placeholder:text-muted-foreground/60',
            'transition-all duration-200',
            'focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20',
            'hover:border-border/80',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            !leftIcon && 'px-3.5',
            error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-surface border border-border rounded-xl text-sm text-foreground',
          'px-3.5 py-2.5 placeholder:text-muted-foreground/60',
          'transition-all duration-200 resize-none',
          'focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-destructive/50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
