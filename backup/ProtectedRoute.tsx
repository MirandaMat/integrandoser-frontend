// integrandoser/src/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
     // Redireciona para uma página de "não autorizado" ou para a home
     return <Navigate to="/" replace />; 
  }

  return <Outlet />; // Renderiza o componente filho (ex: AdmDashboard)
};

export default ProtectedRoute;