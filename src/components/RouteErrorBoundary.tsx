import React from 'react';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches lazy-loaded route chunk failures and renders a retry UI instead of
 * leaving the user stuck on a blank screen or Suspense fallback.
 */
export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-[#0D1B2E] p-8 text-center space-y-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            تعذّر تحميل هذه الصفحة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center justify-center rounded-lg bg-[#001F4D] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
