import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global React Error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#080b11',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#111726',
            border: '1px solid #ef4444',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '540px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171', marginBottom: '8px' }}>
              Произошла ошибка при загрузке интерфейса
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              {this.state.error?.message || 'Не удалось инициализировать состояние компонента.'}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#10b981',
                color: '#022c22',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Очистить кэш и перезагрузить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
)
