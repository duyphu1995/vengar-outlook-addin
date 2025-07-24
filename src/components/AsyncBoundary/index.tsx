import { NetworkError, NetworkErrorBoundary } from 'rest-hooks';
import React, { ComponentType, Suspense } from 'react';

interface AsyncBoundaryProps {
  children: React.ReactNode;
  errorFallback: ComponentType<{ error: NetworkError }>;
  loadingFallback: ComponentType;
}

export default function AsyncBoundary({
  children,
  errorFallback,
  loadingFallback
}: AsyncBoundaryProps) {
  return (
    <Suspense fallback={React.createElement(loadingFallback)}>
      <NetworkErrorBoundary fallbackComponent={errorFallback}>
        {children}
      </NetworkErrorBoundary>
    </Suspense>
  );
}
