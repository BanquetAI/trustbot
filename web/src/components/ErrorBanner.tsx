/**
 * ErrorBanner Component
 *
 * Displays API connection errors with retry option.
 */

interface ErrorBannerProps {
    error: string;
    onRetry?: () => void;
    onDismiss?: () => void;
}

export function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
    return (
        <div
            className="error-banner"
            role="alert"
            aria-live="assertive"
        >
            <div className="error-content">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <div className="error-text">
                    <strong>Connection Issue</strong>
                    <p>{error}</p>
                </div>
                <div className="error-actions">
                    {onRetry && (
                        <button
                            className="btn btn-small"
                            onClick={onRetry}
                            aria-label="Retry connection"
                        >
                            Retry
                        </button>
                    )}
                    {onDismiss && (
                        <button
                            className="btn btn-small btn-ghost"
                            onClick={onDismiss}
                            aria-label="Dismiss error"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
            <p className="error-hint">Using offline data. Some features may be unavailable.</p>
        </div>
    );
}
