import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 role="alert" className="text-c-title font-semibold">
        {t('error.title')}
      </h1>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-touch rounded-btn border border-current px-8 text-c-body font-semibold"
      >
        {t('error.reload')}
      </button>
    </main>
  );
}

interface ErrorBoundaryState {
  failed: boolean;
}

/** Catches a crash anywhere below it and shows a plain message with a reload button. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render() {
    return this.state.failed ? <ErrorFallback /> : this.props.children;
  }
}
