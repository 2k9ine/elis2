import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({
  label,
  error,
  helper,
  icon: Icon,
  className,
  containerClassName,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-disabled',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150',
            Icon && 'pl-10',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-text-muted">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

const TextArea = forwardRef(({
  label,
  error,
  helper,
  className,
  containerClassName,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary',
          'placeholder:text-text-disabled',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'resize-y min-h-[100px]',
          'transition-all duration-150',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-text-muted">{helper}</p>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

const Select = forwardRef(({
  label,
  error,
  helper,
  options = [],
  className,
  containerClassName,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-150 appearance-none',
          'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E")] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {props.placeholder && (
          <option value="" disabled>{props.placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-text-muted">{helper}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export { Input, TextArea, Select };
