import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Basic loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )} 
    />
  );
};

// Full page loading overlay
interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...', 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-auto">
        <CardContent className="flex items-center space-x-4 p-6">
          <LoadingSpinner size="lg" />
          <span className="text-lg font-medium">{message}</span>
        </CardContent>
      </Card>
    </div>
  );
};

// Loading state for buttons
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText,
  children,
  disabled,
  className,
  variant = 'default',
  size = 'default',
  ...props
}) => {
  return (
    <Button
      disabled={isLoading || disabled}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {isLoading ? (loadingText || 'Loading...') : children}
    </Button>
  );
};

// Skeleton loaders for different content types
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Error state with retry functionality
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to load data. Please try again.',
  onRetry,
  retryText = 'Try Again',
  className,
}) => (
  <Card className={cn('w-full', className)}>
    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <RefreshCw className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryText}
        </Button>
      )}
    </CardContent>
  </Card>
);

// Empty state component
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There are no items to display.',
  action,
  icon,
  className,
}) => (
  <Card className={cn('w-full', className)}>
    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </CardContent>
  </Card>
);

// Progressive loading component for data tables
interface ProgressiveLoadingProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  onRetry?: () => void;
  loadingSkeleton: React.ReactNode;
  emptyState: React.ReactNode;
  children: React.ReactNode;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loadingSkeleton,
  emptyState,
  children,
}) => {
  if (isLoading) {
    return <>{loadingSkeleton}</>;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        message={error.message || 'An unexpected error occurred'}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
};
