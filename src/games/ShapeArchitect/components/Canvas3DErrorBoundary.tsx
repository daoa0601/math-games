import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary for Three.js Canvas components.
 * Catches WebGL/Three.js initialization errors and shows a fallback UI.
 */
export class Canvas3DErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log the error for debugging
        console.error('3D Canvas Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="sa-3d-error" role="alert">
                    <div className="sa-3d-error__icon">⚠️</div>
                    <h3 className="sa-3d-error__title">3D View Unavailable</h3>
                    <p className="sa-3d-error__message">
                        Could not initialize 3D graphics. Try using 2D view instead.
                    </p>
                    <details className="sa-3d-error__details">
                        <summary>Technical details</summary>
                        <pre>{this.state.error?.message}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}
