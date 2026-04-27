interface Props {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export default function Skeleton({ className = '', rounded = 'md' }: Props) {
  const r = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];
  return <div className={`skeleton ${r} ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="card flex items-center gap-3">
      <Skeleton className="w-10 h-10" rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-12" />
    </div>
  );
}
