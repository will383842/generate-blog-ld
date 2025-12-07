import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Bug, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isRetrying: false,
    showDetails: false,
  };

  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  public override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries ?? 3;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Délai progressif: 500ms, 1000ms, 2000ms...
    const delay = Math.min(500 * Math.pow(2, retryCount), 5000);

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false,
      });
    }, delay);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      showDetails: false,
    });
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleGoHome = () => {
    window.location.href = '/admin';
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Copier dans le presse-papier
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Détails de l\'erreur copiés dans le presse-papier');
      })
      .catch(() => {
        console.log('Error report:', errorReport);
        alert('Consultez la console pour les détails de l\'erreur');
      });
  };

  private toggleDetails = () => {
    this.setState((state) => ({ showDetails: !state.showDetails }));
  };

  public override render() {
    const { hasError, error, errorInfo, retryCount, isRetrying, showDetails } = this.state;
    const maxRetries = this.props.maxRetries ?? 3;
    const canRetry = retryCount < maxRetries;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Oups ! Une erreur est survenue
              </h2>
              <p className="text-gray-600 mb-2">
                {error?.message || 'Une erreur inattendue s\'est produite.'}
              </p>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  Tentative {retryCount}/{maxRetries}
                </p>
              )}
            </div>

            {/* Actions principales */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="flex-1"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Nouvelle tentative...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={this.handleGoBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>

            {/* Actions secondaires */}
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <Button
                variant="ghost"
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
              <Button
                variant="ghost"
                onClick={this.handleReportError}
                className="flex-1"
              >
                <Bug className="w-4 h-4 mr-2" />
                Signaler
              </Button>
            </div>

            {/* Détails techniques (accordéon) */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={this.toggleDetails}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {showDetails ? '▼' : '▶'} Détails techniques
              </button>
              {showDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg overflow-auto max-h-48">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {error?.stack || 'Aucun stack trace disponible'}
                    {errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}