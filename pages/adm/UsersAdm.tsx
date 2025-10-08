import { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import '../../styles/Admin.css';
import UserProfileModal from './UserProfileModal';
import { FiEdit, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';

// Opções para os campos de seleção
const genderOptions = ['Não especificado', 'Homem', 'Mulher'];
const modalityOptions = ['Não especificado', 'Presencial', 'Virtual', 'Híbrido'];
const approachOptions = [
    'Psicoterapia Junguiana', 'Astróloga', 'Terapia de Casal e Família', 
    'Relacionamentos', 'Mulheres', 'Especialista em Transtornos Alimentares', 
    'Escuta empática, como base do atendimento', 'Criação de um espaço seguro e acolhedor'
];

// ===================================================================
// Componente do Modal (Criar/Editar Usuário)
// ===================================================================
const UserModal = ({ isOpen, onClose, onSave, userToEdit, apiError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('3');
    const [profileData, setProfileData] = useState<any>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    const isEditMode = useMemo(() => !!userToEdit, [userToEdit]);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && userToEdit) {
                setEmail(userToEdit.email || '');
                setRoleId(String(userToEdit.role_id) || '3');
                setProfileData(userToEdit.profile || {});
                setPassword('');
            } else {
                setEmail(''); setPassword(''); setRoleId('3'); setProfileData({});
            }
            setImageFile(null);
        }
    }, [userToEdit, isEditMode, isOpen]);

    const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleApproachChange = (approach: string) => {
        const currentApproaches = profileData.abordagem ? profileData.abordagem.split(', ') : [];
        const newApproaches = currentApproaches.includes(approach)
            ? currentApproaches.filter(a => a !== approach)
            : [...currentApproaches, approach];
        setProfileData({ ...profileData, abordagem: newApproaches.join(', ') });
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', email);
        formData.append('role_id', roleId);
        formData.append('profileData', JSON.stringify(profileData));
        if (imageFile) formData.append('imagem_perfil', imageFile);
        if (password) formData.append('password', password);
        onSave(formData, userToEdit?.id);
    };
    
    if (!isOpen) return null;

    const formatDateForInput = (dateStringOrObject) => {
        if (!dateStringOrObject) return '';
        const date = new Date(dateStringOrObject);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const renderProfileFields = () => {
        switch (roleId) {
            case '1': // ADM
                return (
                    <div className="form-grid">
                        <div className="form-group"><label>Nome Completo</label><input type="text" name="nome" value={profileData.nome || ''} onChange={handleProfileChange} required /></div>
                        <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={profileData.cpf || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>CNPJ</label><input type="text" name="cnpj" value={profileData.cnpj || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" name="data_nascimento" value={formatDateForInput(profileData.data_nascimento)} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Gênero</label><select name="genero" value={profileData.genero || ''} onChange={handleProfileChange}>{genderOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                        <div className="form-group"><label>Telefone</label><input type="text" name="telefone" value={profileData.telefone || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Email de Contato</label><input type="email" name="email" value={profileData.email || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Endereço</label><input type="text" name="endereco" value={profileData.endereco || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Profissão</label><input type="text" name="profissao" value={profileData.profissao || ''} onChange={handleProfileChange} /></div>
                    </div>
                );
            case '2': // PROFISSIONAL
                 return (
                    <div className="form-grid">
                        <div className="form-group"><label>Nome Completo</label><input type="text" name="nome" value={profileData.nome || ''} onChange={handleProfileChange} required/></div>
                        <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={profileData.cpf || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>CNPJ</label><input type="text" name="cnpj" value={profileData.cnpj || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" name="data_nascimento" value={formatDateForInput(profileData.data_nascimento)} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Gênero</label><select name="genero" value={profileData.genero || ''} onChange={handleProfileChange}>{genderOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                        <div className="form-group"><label>Endereço</label><input type="text" name="endereco" value={profileData.endereco || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Cidade</label><input type="text" name="cidade" value={profileData.cidade || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Telefone</label><input type="text" name="telefone" value={profileData.telefone || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Email de Contato</label><input type="email" name="email" value={profileData.email || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Nível</label>
                           <select name="level" value={profileData.level || 'Profissional'} onChange={handleProfileChange}>
                                <option value="Profissional">Profissional</option>
                                <option value="Profissional Habilitado">Profissional Habilitado (Pode criar pacientes)</option>
                           </select></div>
                        <div className="form-group"><label>Profissão</label><input type="text" name="profissao" value={profileData.profissao || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Modalidade</label><select name="modalidade_atendimento" value={profileData.modalidade_atendimento || ''} onChange={handleProfileChange}>{modalityOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        <div className="form-group"><label>Especialidade</label><input type="text" name="especialidade" value={profileData.especialidade || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Tipo de Acompanhamento</label><input type="text" name="tipo_acompanhamento" value={profileData.tipo_acompanhamento || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Experiência</label><textarea name="experiencia" value={profileData.experiencia || ''} onChange={handleProfileChange}></textarea></div>
                        <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Abordagem (selecione várias)</label><div className="multi-select-container">{approachOptions.map(opt => (<div key={opt} className="multi-select-option"><input type="checkbox" id={`abordagem-${opt}`} checked={profileData.abordagem?.includes(opt)} onChange={() => handleApproachChange(opt)} /><label htmlFor={`abordagem-${opt}`} style={{marginBottom: 0, fontWeight: 400}}>{opt}</label></div>))}</div></div>
                    </div>
                    
                );
            case '3': // PACIENTE
                 return (
                    <div className="form-grid">
                        <div className="form-group"><label>Nome Completo</label><input type="text" name="nome" value={profileData.nome || ''} onChange={handleProfileChange} required/></div>
                        <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={profileData.cpf || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Telefone</label><input type="text" name="telefone" value={profileData.telefone || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Profissão</label><input type="text" name="profissao" value={profileData.profissao || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Renda</label><input type="number" step="0.01" name="renda" value={profileData.renda || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Preferência Gênero Atendimento</label><select name="preferencia_gen_atend" value={profileData.preferencia_gen_atend || ''} onChange={handleProfileChange}>{genderOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" name="data_nascimento" value={formatDateForInput(profileData.data_nascimento)} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Gênero</label><select name="genero" value={profileData.genero || ''} onChange={handleProfileChange}>{genderOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                        <div className="form-group"><label>Endereço</label><input type="text" name="endereco" value={profileData.endereco || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Cidade</label><input type="text" name="cidade" value={profileData.cidade || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Tipo de Atendimento</label><input type="text" name="tipo_atendimento" value={profileData.tipo_atendimento || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Modalidade</label><select name="modalidade_atendimento" value={profileData.modalidade_atendimento || ''} onChange={handleProfileChange}>{modalityOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    </div>
                );
            case '4': // EMPRESA
                return (
                    <div className="form-grid">
                        <div className="form-group"><label>Nome da Empresa</label><input type="text" name="nome_empresa" value={profileData.nome_empresa || ''} onChange={handleProfileChange} required/></div>
                        <div className="form-group"><label>CNPJ</label><input type="text" name="cnpj" value={profileData.cnpj || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Nº de Colaboradores</label><input type="number" name="num_colaboradores" value={profileData.num_colaboradores || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Nome do Responsável</label><input type="text" name="nome_responsavel" value={profileData.nome_responsavel || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Cargo do Responsável</label><input type="text" name="cargo" value={profileData.cargo || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Telefone de Contato</label><input type="text" name="telefone" value={profileData.telefone || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Email de Contato</label><input type="email" name="email_contato" value={profileData.email_contato || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Tipo de Atendimento</label><input type="text" name="tipo_atendimento" value={profileData.tipo_atendimento || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group"><label>Frequência</label><input type="text" name="frequencia" value={profileData.frequencia || ''} onChange={handleProfileChange} /></div>
                        <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Descrição</label><textarea name="descricao" value={profileData.descricao || ''} onChange={handleProfileChange}></textarea></div>
                        <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Expectativa</label><textarea name="expectativa" value={profileData.expectativa || ''} onChange={handleProfileChange}></textarea></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{isEditMode ? 'Editar Usuário' : 'Criar Novo Usuário'}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-form">
                    <h4>Dados de Acesso</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>Email (Login)</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                        <div className="form-group"><label>Papel</label><select value={roleId} onChange={e => setRoleId(e.target.value)} required disabled={isEditMode}><option value="3">Paciente</option><option value="2">Profissional</option><option value="4">Empresa</option><option value="1">Administrador</option></select></div>
                        <div className="form-group"><label>{isEditMode ? 'Nova Senha (opcional)' : 'Senha Provisória'}</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!isEditMode} /></div>
                    </div>
                    
                    <h4>Dados do Perfil</h4>
                    {renderProfileFields()}

                    <div className="form-group" style={{marginTop: '20px'}}><label>Foto de Perfil</label><input type="file" name="imagem_perfil" onChange={handleImageChange} accept="image/*" /></div>
                    
                    {apiError && <p className="error-message">{apiError}</p>}
                    <div className="form-actions"><button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button><button type="submit" className="btn-new-user">{isEditMode ? 'Salvar Alterações' : 'Criar'}</button></div>
                </form>
            </div>
        </div>
    );
};

// ===================================================================
// Componente Principal da Página
// ===================================================================
const UsersAdm = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [modalError, setModalError] = useState('');
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [selectedUserForPreview, setSelectedUserForPreview] = useState(null);
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('Todos');

    const fetchUsers = async () => {
        setLoading(true);
        setPageError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Falha ao buscar usuários.');
            }
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setPageError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData && userData.id) setLoggedInUserId(userData.id);
        } catch (error) { console.error("Erro ao ler dados do usuário:", error); }
        fetchUsers();
    }, []);

    const handleSaveUser = async (formData, userId) => {
        const isEditMode = !!userId;
        const url = isEditMode ? `http://localhost:3001/api/users/${userId}` : 'http://localhost:3001/api/users';
        const method = isEditMode ? 'PUT' : 'POST';

        setModalError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao salvar usuário');
            
            handleCloseEditModal();
            fetchUsers();

        } catch (err: any) {
            setModalError(err.message);
        }
    };

    const handleOpenPreviewModal = async (user) => {
        setPageError('');
        setSelectedUserForPreview({ ...user, isLoading: true });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar detalhes do usuário.');
            
            const fetchedFullUser = await response.json();
            
            const userForPreview = {
                ...user,
                ...fetchedFullUser,
            };
            setSelectedUserForPreview(userForPreview);

        } catch (error: any) {
            setPageError(error.message);
            setSelectedUserForPreview(null);
        }
    };

    const handleOpenCreateModal = () => {
        setUserToEdit(null);
        setEditModalOpen(true);
    };

    const handleOpenEditModal = async (user) => {
        setPageError('');
        if (user.profile) {
            setUserToEdit(user);
            setEditModalOpen(true);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Falha ao carregar dados para edição.');
            }
            
            const fullUserData = await response.json();
            
            setUserToEdit(fullUserData);
            setEditModalOpen(true);

        } catch (error: any) {
            setPageError(error.message);
        }
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setUserToEdit(null);
        setModalError('');
    };

    const handleEditFromPreview = (user) => {
        setSelectedUserForPreview(null);
        handleOpenEditModal(user);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) {
            return;
        }
        setPageError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao excluir usuário.');
            fetchUsers();
        } catch (err: any) {
            setPageError(err.message);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];
        return users
          .filter(user => String(user.id) !== String(loggedInUserId))
          .filter(user => filterRole === 'Todos' || user.role === filterRole)
          .filter(user => 
                (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
           );
    }, [users, searchTerm, filterRole, loggedInUserId]);

    const roles = ['Todos', 'ADM', 'PROFISSIONAL', 'PACIENTE', 'EMPRESA'];

    return (
        <>  
            <UserProfileModal
                isOpen={!!selectedUserForPreview}
                onClose={() => setSelectedUserForPreview(null)}
                user={selectedUserForPreview}
                onEdit={handleEditFromPreview}
            />
            <UserModal 
                isOpen={isEditModalOpen} 
                onClose={handleCloseEditModal}
                onSave={handleSaveUser}
                userToEdit={userToEdit}
                apiError={modalError}
            />
            <div className="management-section">
                <div className="management-header">
                    <h2>Gerenciamento de Usuários</h2>
                    <button className="btn-new-user" onClick={handleOpenCreateModal}>
                        <FiPlus /> Novo Usuário
                    </button>
                </div>
                <div className="user-controls">
                    <div className="search-bar">
                        <FiSearch className="search-icon"/>
                        <input type="text" className="search-input" placeholder="Buscar por nome ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="filter-buttons">
                        {roles.map(role => (
                            <button key={role} onClick={() => setFilterRole(role)} className={`filter-btn ${filterRole === role ? 'active' : ''}`}>
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
                {loading && <p>Carregando...</p>}
                {pageError && <p className="error-message">{pageError}</p>}
                {!loading && !pageError && (
                  <div className="table-wrapper">
                    <table className="user-table">
                      <thead>
                        <tr><th>Nome</th><th>Email</th><th>Papel</th><th>Ações</th></tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? filteredUsers.map((u: any) => (
                          <tr key={u.id}>
                            <td>
                              <div className="user-name-cell" onClick={() => handleOpenPreviewModal(u)}>
                                  <img src={u.imagem_url ? `http://localhost:3001/${u.imagem_url}` : '/assets/default-avatar.png'} alt="avatar" className="user-avatar" />
                                  {u.name || '(Nome não definido)'}
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <div className="role-cell-container">
                                <span className={`role-badge ${u.role?.toLowerCase()}`}>{u.role}</span>
                                {u.role === 'PROFISSIONAL' && u.level === 'Profissional Habilitado' && (
                                  <span className="level-indicator habilitado">Habilitado</span>
                                )}
                              </div>
                            </td>
                            <td className="action-buttons">
                              <button title="Editar" onClick={() => handleOpenEditModal(u)}><FiEdit /></button>
                              <button title="Excluir" onClick={() => handleDeleteUser(u.id)}><FiTrash2 /></button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="no-results-cell">Nenhum usuário encontrado.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
        </>
    );
};

export default UsersAdm;