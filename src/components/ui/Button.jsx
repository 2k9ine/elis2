import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white border-transparent',
    secondary: 'bg-white/5 hover:bg-white/10 text-text-primary border-border hover:border-border-hover',
    outline: 'bg-transparent hover:bg-white/5 text-text-primary border-border hover:border-border-hover',
    ghost: 'bg-transparent hover:bg-white/5 text-text-muted hover:text-text-primary border-transparent',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30',
    success: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
