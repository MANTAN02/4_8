import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-radiant-blue hover:bg-radiant-blue-light text-white focus:ring-radiant-blue',
        gradient: 'bg-gradient-to-r from-radiant-blue to-radiant-orange text-white hover:from-radiant-blue-light hover:to-radiant-orange-light focus:ring-radiant-blue',
        outline: 'border-2 border-radiant-blue text-radiant-blue hover:bg-radiant-blue hover:text-white focus:ring-radiant-blue',
        ghost: 'text-radiant-blue hover:bg-radiant-blue/10 focus:ring-radiant-blue',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
      },
      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-4 text-sm',
        md: 'h-10 px-6',
        lg: 'h-12 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full',
      },
      width: {
        auto: 'w-auto',
        full: 'w-full',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
        glow: 'animate-glow',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'md',
      width: 'auto',
      animation: 'none',
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    variant,
    size,
    rounded,
    width,
    animation,
    isLoading,
    leftIcon,
    rightIcon,
    tooltip,
    children,
    ...props
  }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, rounded, width, animation }),
          isLoading && 'opacity-70 cursor-wait',
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        title={tooltip}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton, buttonVariants };
