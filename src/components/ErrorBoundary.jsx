import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ec-bg)' }}>
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center" style={{ border: '1px solid var(--ec-card-border)' }}>
            <div className="text-4xl mb-4">⚠</div>
            <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--ec-text)', fontFamily: 'var(--font-heading)' }}>
              Something went wrong
            </h1>
            <p className="text-sm mb-4" style={{ color: 'var(--ec-text-secondary)' }}>
              An unexpected error occurred. Please reload the page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left p-3 rounded-lg mb-4 overflow-auto max-h-32" style={{ background: '#f5f5f5', color: '#666' }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--ec-gold)', color: 'var(--ec-nav-bg)' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
