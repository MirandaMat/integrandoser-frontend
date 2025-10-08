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

  // ===================================================================
  // --- VERIFICA SE O USUÁRIO JÁ ESTÁ LOGADO AO CARREGAR A PÁGINA ---
  // Se estiver, redireciona imediatamente para o dashboard correto.
  // ===================================================================
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
  }, [navigate]); // O array de dependências garante que isso rode apenas uma vez

  // ===================================================================
  // --- FUNÇÃO PARA LIDAR COM O SUBMIT DO FORMULÁRIO DE LOGIN ---
  // ===================================================================
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
      
      console.log("Dados do usuário recebidos da API:", data.user);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Se for o primeiro login, redireciona para completar o perfil
      if (data.user.first_login) {
        console.log("Detectado primeiro login, redirecionando para /complete-profile");
        navigate('/complete-profile');
        return;
      }
      
      // Se não, redireciona para o dashboard correspondente à role
      const userRole = data.user.role;
      console.log(`Role do usuário: ${userRole}. Redirecionando...`);

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
          console.log("Role não reconhecida, redirecionando para a home.");
          navigate('/');
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===================================================================
  // --- RENDERIZAÇÃO DO COMPONENTE (FORMULÁRIO) ---
  // ===================================================================
  return (
    <div className="login-page-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
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