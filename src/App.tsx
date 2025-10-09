import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// --- Layouts ---
import PublicLayout from './layout/PublicLayout';
import GeneralLayout from './layout/GeneralLayout';
import { SocketProvider } from './components/SocketProvider';
import { NotificationProvider } from './components/NotificationProvider';
import SettingsPage from './pages/SettingsPage';

// --- Rota Protegida ---
import ProtectedRoute from './routes/ProtectedRoute';

// --- Páginas Públicas ---
import HomePage from './pages/HomePage';
import Terapeutas from './Terapeutas';
import BlogPosters from './BlogPosters';
import TPT from './TPT';
import Service from './Service';
import Login from './Login';
import TriagemForm from './TriagemForm';
import CompleteProfile from './pages/CompleteProfile';
import ScheduleAppointmentPage from './ScheduleAppointmentPage';

// --- Páginas do ADM ---
import AdmDashboard from './pages/adm/Admin';
import UsersAdm from './pages/adm/UsersAdm';
import ProfileAdm from './pages/adm/ProfileAdm';
import AdminAgenda from './pages/adm/AdminAgenda';
import MessagesPage from './pages/MessagesPage';
import AdminFinanceiro from './pages/adm/AdminFinanceiro';
import AdminCobranca from './pages/adm/AdminCobranca';
import AdminProfessionalStatement from './pages/adm/AdminProfessionalStatement';
import AdminFaturas from './pages/adm/AdminFaturas';
import ContentManagement from './pages/adm/ContentManagement';
import AdminTriagem from './pages/adm/AdminTriagem';
import CalendarPage from './pages/CalendarPage';

// --- Páginas do PROFISSIONAL ---
import ProfissionalDashboard from './pages/profissional/Profissional';
import ProfissionalAgenda from './pages/profissional/ProfissionalAgenda';
import ProfissionalFinanceiro from './pages/profissional/ProfissionalFinanceiro';
import PacientesProfissional from './pages/profissional/PacientesProfissional';
import NotasPaciente from './pages/profissional/NotasPaciente';
import DiarioPacienteProfissional from './pages/profissional/DiarioPacienteProfissional';
import ProfissionalCobranca from './pages/profissional/ProfissionalCobranca';

// --- Páginas do PACIENTE ---
// Renomeei o arquivo Paciente.tsx para PacienteDashboard.tsx para clareza
import PacienteDashboard from './pages/paciente/Paciente'; 
import PacienteAgenda from './pages/paciente/PacienteAgenda'; // Nova página
import PacienteFinanceiro from './pages/paciente/PacienteFinanceiro';
import DiarioSonhos from './pages/paciente/DiarioSonhos';

// --- Páginas da EMPRESA ---
// Renomeei o arquivo Empresa.tsx para EmpresaDashboard.tsx para clareza
import EmpresaDashboard from './pages/empresa/Empresa';
import EmpresaAgenda from './pages/empresa/EmpresaAgenda'; // Nova página
import EmpresaFinanceiro from './pages/empresa/EmpresaFinanceiro'; 


// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================
function App() {
  return (
    <BrowserRouter>
      <SocketProvider> 
        <NotificationProvider> 
          <Routes>
            {/* --- Rotas Públicas --- */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="terapeutas" element={<Terapeutas />} />
              <Route path="blogposters" element={<BlogPosters />} />
              <Route path="TPT" element={<TPT />} />
              <Route path="service/:serviceSlug" element={<Service />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* --- Rota de Login --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/triagem" element={<TriagemForm />} />
            <Route path="/schedule-appointment" element={<ScheduleAppointmentPage />} />
            
            {/* --- ROTAS PROTEGIDAS --- */}


            {/* --- ROTA PROTEGIDA PARA COMPLETAR O PERFIL --- */}
            <Route element={<ProtectedRoute allowedRoles={['ADM', 'PROFISSIONAL', 'PACIENTE', 'EMPRESA']} />}>
                <Route path="/complete-profile" element={<CompleteProfile />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADM', 'PROFISSIONAL', 'PACIENTE', 'EMPRESA']} />}>
              <Route element={<GeneralLayout />}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* --- Rotas do ADMINISTRADOR --- */}
            <Route element={<ProtectedRoute allowedRoles={['ADM']} />}>
              <Route path="/admin" element={<GeneralLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdmDashboard />} />
                <Route path="users" element={<UsersAdm />} />
                <Route path="profile" element={<ProfileAdm />} />
                <Route path="agenda" element={<AdminAgenda />} />
                <Route path="calendario" element={<CalendarPage />} /> 
                <Route path="messages" element={<MessagesPage />} />
                <Route path="financeiro" element={<AdminFinanceiro />} />
                <Route path="financeiro/profissional/:professionalId" element={<AdminProfessionalStatement />} />
                <Route path="financeiro/faturas" element={<AdminFaturas />} />
                <Route path="cobrancas" element={<AdminCobranca />} />
                <Route path="content" element={<ContentManagement />} />
                <Route path="triagem" element={<AdminTriagem />} /> 
                
              </Route>
            </Route>

            {/* --- Rotas do PROFISSIONAL --- */}
            <Route element={<ProtectedRoute allowedRoles={['PROFISSIONAL']} />}>
              <Route path="/professional" element={<GeneralLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ProfissionalDashboard />} />
                <Route path="profile" element={<ProfileAdm />} />
                <Route path="agenda" element={<ProfissionalAgenda />} />
                <Route path="calendario" element={<CalendarPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="financeiro" element={<ProfissionalFinanceiro />} />
                <Route path="pacientes" element={<PacientesProfissional />} />
                <Route path="pacientes/:patientId/notes" element={<NotasPaciente />} />
                <Route path="pacientes/:patientId/diario" element={<DiarioPacienteProfissional />} />
                <Route path="cobrancas" element={<ProfissionalCobranca />} />
              </Route>
            </Route>

            {/* --- Rotas do PACIENTE --- */}
            <Route element={<ProtectedRoute allowedRoles={['PACIENTE']} />}>
              <Route path="/paciente" element={<GeneralLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PacienteDashboard />} />
                <Route path="agenda" element={<PacienteAgenda />} />
                <Route path="profile" element={<ProfileAdm />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="financeiro" element={<PacienteFinanceiro />} /> 
                <Route path="diario" element={<DiarioSonhos />} /> 
              </Route>
            </Route>
            
            {/* --- Rotas da EMPRESA --- */}
            <Route element={<ProtectedRoute allowedRoles={['EMPRESA']} />}>
              <Route path="/empresa" element={<GeneralLayout />}>
                {/* Redireciona para o dashboard ao acessar /empresa */}
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<EmpresaDashboard />} />
                <Route path="agenda" element={<EmpresaAgenda />} />
                <Route path="profile" element={<ProfileAdm />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="financeiro" element={<EmpresaFinanceiro />} />
              </Route>
            </Route>

            {/* --- Rota de Fallback --- */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </NotificationProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;