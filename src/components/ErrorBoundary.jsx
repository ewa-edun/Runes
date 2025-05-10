import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRetrying: false,
      isNavigating: false
    };
    this.retryTimeoutId = null;
    this.navigationTimeoutId = null;
    this.navigationResetTimeoutId = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to your error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    // You could send this to your error reporting service
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: typeof __DEV__ !== 'undefined' ? 'development' : 'production',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: {
        memory: window.performance?.memory,
        timing: window.performance?.timing,
        navigation: window.performance?.navigation
      },
      network: {
        type: navigator.connection?.type,
        effectiveType: navigator.connection?.effectiveType,
        downlink: navigator.connection?.downlink,
        rtt: navigator.connection?.rtt
      }
    };

    // Log the full error report
    console.error('Error report:', errorReport);

    // Here you would typically send this to your error reporting service
    // Example: sendToErrorReporting(errorReport);
  }

  componentWillUnmount() {
    // Clear any pending timeouts
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.navigationTimeoutId) {
      clearTimeout(this.navigationTimeoutId);
    }
    if (this.navigationResetTimeoutId) {
      clearTimeout(this.navigationResetTimeoutId);
    }
  }

  handleRetry = async () => {
    // Clear any existing timeouts
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({ isRetrying: true });

    try {
      // Set a timeout to prevent infinite loading state
      const timeoutPromise = new Promise((_, reject) => {
        this.retryTimeoutId = setTimeout(() => {
          reject(new Error('Retry timeout - operation took too long'));
        }, 10000); // 10 second timeout
      });

      // If a retry callback was provided, call it
      const retryPromise = this.props.onRetry 
        ? Promise.resolve(this.props.onRetry())
        : Promise.resolve();

      // Race between the timeout and the retry operation
      await Promise.race([retryPromise, timeoutPromise]);

      // Clear the timeout if successful
      if (this.retryTimeoutId) {
        clearTimeout(this.retryTimeoutId);
        this.retryTimeoutId = null;
      }

      // Clear the error state
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        isRetrying: false 
      });
    } catch (error) {
      // Clear the timeout if it exists
      if (this.retryTimeoutId) {
        clearTimeout(this.retryTimeoutId);
        this.retryTimeoutId = null;
      }

      // If retry fails, show error again
      this.setState({ 
        hasError: true, 
        error: {
          ...error,
          message: error.message.includes('timeout') 
            ? 'Operation timed out. Please try again.'
            : error.message
        }, 
        isRetrying: false,
        errorInfo: {
          componentStack: error.stack || 'Failed to retry'
        }
      });
    }
  };

  handleGoBack = () => {
    // Clear any existing timeouts
    if (this.navigationTimeoutId) {
      clearTimeout(this.navigationTimeoutId);
      this.navigationTimeoutId = null;
    }
    if (this.navigationResetTimeoutId) {
      clearTimeout(this.navigationResetTimeoutId);
      this.navigationResetTimeoutId = null;
    }

    this.setState({ isNavigating: true });

    // Set a timeout to prevent infinite loading state
    this.navigationTimeoutId = setTimeout(() => {
      window.history.back();
      this.navigationTimeoutId = null;
    }, 100); // Small delay for visual feedback

    // Set another timeout to reset state if navigation fails
    this.navigationResetTimeoutId = setTimeout(() => {
      this.setState({ isNavigating: false });
      this.navigationResetTimeoutId = null;
    }, 2000); // Reset after 2 seconds if navigation fails
  };

  render() {
    if (this.state.hasError) {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      
      return (
        <div className="error-boundary">
          <svg viewBox="0 0 24 24" className="icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3>Something went wrong</h3>
          <p>{errorMessage}</p>
          
          {isDev && this.state.errorInfo && (
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}

          <div className="error-actions">
            <button 
              className={`btn retry-btn ${this.state.isRetrying ? 'retrying' : ''}`}
              onClick={this.handleRetry}
              disabled={this.state.isRetrying || this.state.isNavigating}
            >
              {this.state.isRetrying ? (
                <>
                  <div className="spinner spinner-small"></div>
                  <span>Retrying...</span>
                </>
              ) : (
                'Try Again'
              )}
            </button>
            <button 
              className={`btn btn-outline ${this.state.isNavigating ? 'navigating' : ''}`}
              onClick={this.handleGoBack}
              disabled={this.state.isRetrying || this.state.isNavigating}
            >
              {this.state.isNavigating ? (
                <>
                  <div className="spinner spinner-small"></div>
                  <span>Going back...</span>
                </>
              ) : (
                'Go Back'
              )}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}