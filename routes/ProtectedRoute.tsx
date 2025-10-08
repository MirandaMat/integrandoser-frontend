import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userString);

  if (!allowedRoles.includes(user.role)) {
     // Redireciona para a home se o usuário não tiver a permissão necessária
     return <Navigate to="/" replace />; 
  }

  // Se estiver tudo certo, renderiza a rota filha
  return <Outlet />;
}