import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Layout e Rota Protegida
import GeneralLayout from './layout/GeneralLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Nosso componente "armadilha"
import ErrorBoundary from './components/ErrorBoundary';

// Apenas a página que queremos testar
import AdminAgenda from './pages/adm/AdminAgenda';

// ===================================================================
// VERSÃO DE DEPURAÇÃO DO APP
// ===================================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Adicionamos uma rota simples para o login para facilitar o teste */}
        <Route path="/login" element={<div><h1>Página de Login</h1><p>Faça o login e depois navegue para /admin/agenda.</p></div>} />

        {/* --- ROTA DO ADMINISTRADOR EM TESTE --- */}
        <Route element={<ProtectedRoute allowedRoles={['ADM']} />}>
          <Route path="/admin" element={<GeneralLayout />}>
            
            {/* A rota da agenda agora está envolvida pelo ErrorBoundary */}
            <Route 
              path="agenda" 
              element={
                <ErrorBoundary>
                  <AdminAgenda />
                </ErrorBoundary>
              } 
            />
            
            {/* Adicionamos um redirecionamento para facilitar */}
            <Route path="*" element={<Navigate to="/admin/agenda" replace />} />
          </Route>
        </Route>

        {/* Rota padrão para qualquer outra coisa */}
        <Route path="*" element={<h1>Página Inicial</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;