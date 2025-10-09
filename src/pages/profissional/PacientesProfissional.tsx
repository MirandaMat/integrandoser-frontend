// src/pages/profissional/PacientesProfissional.tsx
import { useState, useEffect, useMemo, ChangeEvent, FormEvent, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUserPlus, FiSearch, FiEdit, FiTrash2, FiBookOpen, FiFileText } from 'react-icons/fi';
import '../../styles/Admin.css'; // Reutilizando estilos

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// --- Interfaces de Tipagem ---
interface Patient {
    id: number;
    nome: string;
    user_id: number;
    email: string;
    cpf?: string;
    telefone?: string;
    data_nascimento?: string;
}

interface CurrentUser {
    level?: string;
    [key: string]: any;
}

// --- Componente do Modal de Criação de Paciente ---
const PatientModal = ({ isOpen, onClose, onSave, apiError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profileData, setProfileData] = useState<any>({});

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setProfileData({});
        }
    }, [isOpen]);

    const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            email,
            password,
            profileData: JSON.stringify(profileData)
        };
        onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Novo Paciente</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-form">
                    <h4>Dados de Acesso</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>Email (Login)</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                        <div className="form-group"><label>Senha Provisória</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                    </div>
                    <h4>Dados do Perfil</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>Nome Completo</label><input type="text" name="nome" value={profileData.nome || ''} onChange={handleProfileChange} required /></div>
                        <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={profileData.cpf || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Telefone</label><input type="text" name="telefone" value={profileData.telefone || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" name="data_nascimento" value={profileData.data_nascimento || ''} onChange={handleProfileChange} /></div>
                    </div>
                    {apiError && <p className="error-message">{apiError}</p>}
                    <div className="form-actions"><button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button><button type="submit" className="btn-new-user">Criar Paciente</button></div>
                </form>
            </div>
        </div>
    );
};


// --- NOVO Componente do Modal de EDIÇÃO de Paciente ---
const EditPatientModal = ({ isOpen, onClose, onSave, patient, apiError }) => {
    const [profileData, setProfileData] = useState<Partial<Patient>>({});

    useEffect(() => {
        // Popula o formulário com os dados do paciente ao abrir
        if (isOpen && patient) {
            // CORRIGIDO: Garante que 'data_nascimento' é uma string antes de usar .split()
            const formattedDate = (typeof patient.data_nascimento === 'string') 
                ? patient.data_nascimento.split('T')[0] 
                : '';

            setProfileData({
                nome: patient.nome,
                cpf: patient.cpf,
                telefone: patient.telefone,
                data_nascimento: formattedDate,
            });
        }
    }, [isOpen, patient]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(patient.id, { profileData });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Editar Paciente</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-form">
                    <h4>Dados do Perfil</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>Nome Completo</label><input type="text" name="nome" value={profileData.nome || ''} onChange={handleChange} required /></div>
                        <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={profileData.cpf || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Telefone</label><input type="text" name="telefone" value={profileData.telefone || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" name="data_nascimento" value={profileData.data_nascimento || ''} onChange={handleChange} /></div>
                    </div>
                    {apiError && <p className="error-message">{apiError}</p>}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-new-user">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Componente Principal da Página ---
const PacientesProfissional = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [modalError, setModalError] = useState('');

    const token = useMemo(() => localStorage.getItem('token'), []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [profileRes, associatesRes] = await Promise.all([
                fetch(`${apiUrl}/api/profile/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/api/users/my-associates`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!profileRes.ok || !associatesRes.ok) throw new Error('Falha ao carregar dados.');
            const profileData = await profileRes.json();
            const associatesData = await associatesRes.json();
            setCurrentUser(profileData);
            setPatients(associatesData.patients || []);
        } catch (err: any) { setError(err.message); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleSavePatient = async (payload) => {
        setModalError('');
        try {
            const response = await fetch(`${apiUrl}/api/users/professional/create-patient`, { //
                method: 'POST', //
                headers: { //
                    'Content-Type': 'application/json', //
                    'Authorization': `Bearer ${token}` //
                },
                body: JSON.stringify(payload) //
            });
            const data = await response.json(); //
            if (!response.ok) throw new Error(data.message || 'Erro ao criar paciente.'); //
            
            // CORRIGIDO: Usa a função correta para fechar o modal de criação
            setCreateModalOpen(false); 
            fetchData(); // Recarrega a lista de pacientes
        } catch (err: any) {
            setModalError(err.message); //
        }
    };

    // FUNÇÕES PARA EDITAR E DELETAR
    const handleEdit = (patient: Patient) => {
        setEditingPatient(patient);
        setEditModalOpen(true);
        setModalError('');
    };

    const handleUpdatePatient = async (patientId: number, payload: any) => {
        setModalError('');
        try {
            const response = await fetch(`http://localhost:3001/api/users/professional/patient/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar paciente.');
            setEditModalOpen(false);
            fetchData();
        } catch (err: any) {
            setModalError(err.message);
        }
    };

    const handleDelete = async (patientId: number) => {
        if (window.confirm('Atenção: Esta ação é irreversível e excluirá o usuário e todos os seus dados associados (agendamentos, notas, etc.). Deseja continuar?')) {
            try {
                const response = await fetch(`http://localhost:3001/api/users/professional/patient/${patientId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Erro ao excluir paciente.');
                fetchData();
            } catch (err: any) {
                alert(`Erro: ${err.message}`);
            }
        }
    };

    if (loading) return <p>Carregando...</p>;
    if (error) return <p className="error-message">{error}</p>;

    const isHabilitado = currentUser?.level === 'Profissional Habilitado';

    return (
        <Fragment>
            <PatientModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSave={handleSavePatient} apiError={modalError} />
            <EditPatientModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleUpdatePatient} patient={editingPatient} apiError={modalError} />
            
            <div className="admin-header">
                <h1>Meus Pacientes</h1>
                <p>Gerencie os perfis dos seus pacientes e adicione novos.</p>
            </div>
            <div className="management-section">
                <div className="management-header">
                    <h2>Lista de Pacientes</h2>
                    {isHabilitado && (
                        <button className="btn-new-user" onClick={() => setCreateModalOpen(true)}>
                            <FiUserPlus /> Novo Paciente
                        </button>
                    )}
                </div>

                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Nome do Paciente</th>
                            <th>Email de Contato</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.length > 0 ? patients.map(p => (
                            <tr key={p.id}>
                                <td>{p.nome}</td>
                                <td>{p.email}</td>
                                <td className="action-buttons">
                                    <button 
                                        title="Ver Diário de Sonhos" 
                                        onClick={() => navigate(`/professional/pacientes/${p.id}/diario`)}
                                    >
                                        <FiBookOpen />
                                    </button>
                                    <button title="Bloco de Notas" onClick={() => navigate(`/professional/pacientes/${p.id}/notes`)}><FiFileText /></button>
                                    
                                    {/* --- BOTÕES CONDICIONAIS --- */}
                                    {isHabilitado && (
                                        <Fragment>
                                            <button title="Editar Paciente" onClick={() => handleEdit(p)}><FiEdit /></button>
                                            <button title="Excluir Paciente" onClick={() => handleDelete(p.id)}><FiTrash2 /></button>
                                        </Fragment>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} style={{textAlign: 'center', padding: '20px'}}>Nenhum paciente associado encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Fragment>
    );
};

export default PacientesProfissional;