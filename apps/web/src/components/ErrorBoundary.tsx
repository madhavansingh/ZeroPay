import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: FallbackProps) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-text-secondary text-sm mb-2">{error.message}</p>
        <p className="text-text-muted text-xs mb-8">
          This error has been automatically reported to our team.
        </p>
        <button
          onClick={resetError}
          className="btn-primary flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}

interface Props {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: Props) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback
          error={error instanceof Error ? error : new Error(String(error))}
          resetError={resetError}
        />
      )}
      onError={(error, errorInfo) => {
        console.error('[ErrorBoundary]', error, errorInfo);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
