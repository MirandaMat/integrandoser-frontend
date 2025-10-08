// src/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Login.css';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (token && userString) {
      const user = JSON.parse(userString);
      const userRole = user.role;
      
      console.log(`Usuário já logado como ${userRole}. Redirecionando...`);

      switch (userRole) {
        case 'ADM':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'PROFISSIONAL':
          navigate('/professional/dashboard', { replace: true });
          break;
        case 'PACIENTE':
          navigate('/paciente/dashboard', { replace: true });
          break;
        case 'EMPRESA':
          navigate('/empresa/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha no login');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.first_login) {
        navigate('/complete-profile');
        return;
      }
      
      const userRole = data.user.role;

      switch (userRole) {
        case 'ADM':
          navigate('/admin/dashboard');
          break;
        case 'PROFISSIONAL':
          navigate('/professional/dashboard');
          break;
        case 'PACIENTE':
          navigate('/paciente/dashboard');
          break;
        case 'EMPRESA':
          navigate('/empresa/dashboard');
          break;
        default:
          navigate('/');
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <img src="/full_branca.png" alt="IntegrandoSer Logo" className="login-logo" />
        <h2 className="login-title">Acesse</h2>
        <p className="login-subtitle">Bem-vindo(a) de volta!</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
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
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
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
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-btn">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;