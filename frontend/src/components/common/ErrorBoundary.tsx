import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Stack,
  Chip
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Stack spacing={3} alignItems="center" textAlign="center">
                <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />

                <Typography variant="h4" gutterBottom>
                  Oops! Something went wrong
                </Typography>

                <Alert severity="error" sx={{ width: '100%' }}>
                  <AlertTitle>Application Error</AlertTitle>
                  We encountered an unexpected error. Don't worry, this has been logged and our team will look into it.
                </Alert>

                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Card variant="outlined" sx={{ width: '100%', bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BugReport fontSize="small" />
                        Debug Information
                        <Chip label="Development Only" size="small" color="warning" />
                      </Typography>

                      <Typography variant="body2" color="error" sx={{ fontFamily: 'monospace', mb: 1 }}>
                        <strong>Error:</strong> {this.state.error.message}
                      </Typography>

                      {this.state.error.stack && (
                        <Box
                          component="pre"
                          sx={{
                            fontSize: '0.75rem',
                            maxHeight: 200,
                            overflow: 'auto',
                            bgcolor: 'background.paper',
                            p: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          {this.state.error.stack}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleRetry}
                    color="primary"
                  >
                    Try Again
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Home />}
                    onClick={this.handleGoHome}
                  >
                    Go to Dashboard
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={this.handleReload}
                    color="secondary"
                  >
                    Reload Page
                  </Button>
                </Stack>

                {/* Contact Information */}
                <Typography variant="body2" color="textSecondary">
                  If this problem persists, please contact your system administrator or IT support team.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;