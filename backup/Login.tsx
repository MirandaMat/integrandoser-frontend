// integrandoser/src/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Login.css';
import { FiMail, FiLock } from 'react-icons/fi'; // Ícones para os inputs

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Falha no login');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user.role === 'ADM') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'PROFISSIONAL') {
        navigate('/professional/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-container"> {/* Novo container para o fundo */}
      <div className="login-card">
        <h2 className="login-title">Área Restrita</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <FiMail className="input-icon" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@exemplo.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <FiLock className="input-icon" />
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Sua senha"
            />
          </div>
          <button type="submit" className="login-btn">
            Entrar
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;