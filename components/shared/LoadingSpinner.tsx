import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  /** Size of the spinner in pixels */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Text to display below the spinner */
  label?: string
}

/**
 * Animated loading spinner component.
 */
export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-current border-t-transparent text-primary',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
    </div>
  )
}

/**
 * Full-page centered loading state.
 */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  )
}
