type ErrorContext = {
  componentStack?: string | null;
  screen?: string;
  extra?: Record<string, unknown>;
};

export function logError(error: unknown, context?: ErrorContext) {
  if (error instanceof Error) {
    console.error('[ErrorBoundary]', error.message, {
      stack: error.stack,
      ...context,
    });
  } else {
    console.error('[ErrorBoundary]', error, context);
  }
}
