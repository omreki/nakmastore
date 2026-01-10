import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white p-8 font-mono">
                    <div className="max-w-4xl mx-auto border border-red-500/50 rounded-2xl p-8 bg-red-950/20">
                        <h1 className="text-3xl font-black text-red-500 mb-4 uppercase tracking-widest">System Failure</h1>
                        <p className="mb-4 text-gray-300">An error occurred while rendering this component.</p>
                        <div className="bg-black/50 p-6 rounded-xl border border-white/10 overflow-auto">
                            <p className="text-red-400 font-bold mb-2">{this.state.error?.toString()}</p>
                            <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
