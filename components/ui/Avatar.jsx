import { cn, getInitials } from '../../lib/utils';

function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  ...props
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={cn(
          'rounded-full object-cover border border-border',
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold',
        sizes[size],
        className
      )}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
