import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você pode logar o erro para um serviço externo aqui
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fff0f0', border: '2px solid red', margin: '20px' }}>
          <h1 style={{ color: 'red' }}>Algo Deu Muito Errado.</h1>
          <p>Ocorreu um erro que impediu esta parte da página de carregar.</p>
          <hr />
          <h3>Detalhes do Erro:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {this.state.error?.toString()}
            <br />
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;