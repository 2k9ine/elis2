import { cn } from '../../lib/utils';

function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  ...props
}) {
  const variants = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    rect: 'rounded-md',
    card: 'h-32 w-full rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-md'
  };

  return (
    <div
      className={cn(
        'skeleton bg-white/5',
        variants[variant],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// Skeleton for table rows
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="flex-1"
              style={{ animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton for cards
export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant="card"
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>
  );
}

// Skeleton for stat cards
export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-background-card border border-border rounded-lg p-6"
        >
          <Skeleton variant="text" className="w-24 mb-2" />
          <Skeleton variant="text" className="w-16 h-8" style={{ animationDelay: `${index * 100}ms` }} />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
