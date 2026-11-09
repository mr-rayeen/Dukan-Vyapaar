import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  onResetToHome?: () => void;
  lang?: 'hi' | 'en';
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Caught by AppErrorBoundary:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || '',
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
    });
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
    });
    if (this.props.onResetToHome) {
      this.props.onResetToHome();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { sectionName, lang = 'en' } = this.props;
      const errMessage = this.state.error?.message || 'Unknown rendering error';

      return (
        <div className="p-4 my-4 rounded-2xl bg-rose-50 dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800 text-slate-900 dark:text-slate-100 shadow-lg space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-rose-900 dark:text-rose-200">
                {lang === 'hi'
                  ? `स्क्रीन लोड करने में समस्या (${sectionName || 'App'})`
                  : `Issue detected in ${sectionName || 'Screen'}`}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {lang === 'hi'
                  ? 'आपका सारा डेटा और बिल पूरी तरह सुरक्षित हैं। नीचे समस्या का कारण दिया गया है:'
                  : 'All your inventory and billing data is safe. Here is what went wrong:'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-rose-200 dark:border-slate-800 text-xs font-mono text-rose-700 dark:text-rose-300 break-words">
            <div className="flex items-center gap-1.5 font-sans font-bold text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {lang === 'hi' ? 'एरर विवरण (Error Reason):' : 'Error Details:'}
              </span>
            </div>
            {errMessage}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {lang === 'hi' ? 'दोबारा कोशिश करें (Retry)' : 'Retry Screen'}
              </span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'होम पेज' : 'Home'}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
