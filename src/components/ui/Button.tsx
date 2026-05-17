<<<<<<< HEAD
import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
=======
import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
>>>>>>> recovery-branch
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

const VARIANTS = {
<<<<<<< HEAD
  primary: 'bg-brand-gradient text-white shadow-glow-sm hover:shadow-glow hover:brightness-110 active:scale-95',
  secondary: 'bg-surface text-foreground border border-border hover:bg-surface-hover hover:border-border/80',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-surface-hover',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20',
  outline: 'border border-border text-foreground hover:bg-surface-hover',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-sm gap-2 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-6 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
=======
  primary:
    "bg-brand-gradient text-white shadow-glow-sm hover:shadow-glow hover:brightness-110 active:scale-95",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-hover hover:border-border/80",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
  destructive:
    "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20",
  outline: "border border-border text-foreground hover:bg-surface-hover",
};

const SIZES = {
  xs: "h-7 px-2.5 text-xs gap-1.5 rounded-lg",
  sm: "h-8 px-3 text-sm gap-2 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-6 text-base gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
>>>>>>> recovery-branch
