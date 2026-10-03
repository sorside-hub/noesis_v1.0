import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-bg-primary text-text-primary text-center">
          <div className="w-12 h-12 rounded-2xl bg-status-error-bg text-status-error flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-bold text-text-heading mb-1">
            Terjadi Kendala Tampilan
          </h3>
          <p className="text-xs text-text-muted max-w-md mb-5 leading-relaxed">
            Editor mengalami gangguan sesaat saat memproses teks. Silakan muat ulang tampilan untuk melanjutkan.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} />
            <span>Muat Ulang Tampilan</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
