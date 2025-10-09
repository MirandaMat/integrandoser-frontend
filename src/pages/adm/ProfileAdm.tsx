// src/pages/adm/ProfileAdm.tsx
import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Adicione os ícones necessários
import { FiCamera, FiSave, FiXCircle, FiEdit, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import '../../styles/general.css';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// --- TIPAGEM DOS DADOS DO PERFIL ---
interface ProfileData {
  role: string;
  email_login: string;
  imagem_url: string;
  [key: string]: any; // Permite outras propriedades
}

const ProfileAdm = ({ isFirstLogin = false }) => {
    // --- GERENCIAMENTO DE ESTADO ---
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [initialProfile, setInitialProfile] = useState<ProfileData | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    // Estados para a nova senha
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(isFirstLogin); // Inicia aberto se for primeiro login
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(isFirstLogin);
    const navigate = useNavigate();

    // --- BUSCA DE DADOS DO PERFIL ---
    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/profile/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Falha ao carregar o perfil.');
            }
            const data = await response.json();
            setProfile(data);
            setInitialProfile(data);
        } catch (error: any) {
            setMessage('Erro: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // --- HANDLERS DE EVENTOS DO FORMULÁRIO ---
    const handleEditClick = () => setIsEditing(true);

    const handleCancelClick = () => {
        setProfile(initialProfile);
        setProfileImageFile(null);
        setPreviewImage(null);
        setMessage('');
        // Reseta os estados da senha
        setNewPassword('');
        setConfirmPassword('');
        if (!isFirstLogin) {
            setIsEditing(false);
            setIsChangingPassword(false);
            navigate(-1);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage('Salvando...');

        // Validação de senha movida para o topo
        if (isChangingPassword && newPassword !== confirmPassword) {
            setMessage('Erro: As senhas não coincidem.');
            return;
        }
        if (isFirstLogin && !newPassword) {
            setMessage('Erro: A nova senha é obrigatória no primeiro acesso.');
            return;
        }
        
        const formData = new FormData();
        if (profile) {
            // Envia apenas os dados que foram alterados para otimizar
            Object.entries(profile).forEach(([key, value]) => {
                // Compara com o valor inicial para ver se mudou
                if (initialProfile && value !== initialProfile[key]) {
                    // Garante que não está enviando um valor nulo que não existia antes
                    if(value !== null) {
                       formData.append(key, value);
                    }
                }
            });
        }

        if (profileImageFile) {
            formData.append('imagem_perfil', profileImageFile);
        }
        
        // Adiciona a senha ao formData se ela estiver sendo alterada
        if (isChangingPassword && newPassword) {
            formData.append('password', newPassword);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/profile/me`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocorreu um erro ao atualizar o perfil.');

            // Lógica de redirecionamento e feedback
            if (isChangingPassword && !isFirstLogin) {
                 alert('Senha alterada com sucesso! Por segurança, você será desconectado. Por favor, faça login novamente.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else if (isFirstLogin) {
                alert('Perfil atualizado com sucesso! Por favor, faça login novamente com sua nova senha.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                setMessage('Perfil atualizado com sucesso!');
                setIsEditing(false);
                setProfileImageFile(null);
                setPreviewImage(null);
                await fetchProfile(); // Re-busca os dados para ter o estado mais recente
                // Dispara um evento global para que o GeneralLayout atualize a foto no header
                window.dispatchEvent(new Event('profileUpdated'));
            }

        } catch (error: any) {
            setMessage('Erro: ' + error.message);
        }
    };

    // --- RENDERIZAÇÃO CONDICIONAL ---
    if (loading) return <div>Carregando perfil...</div>;
    if (!profile) return <div className="error-message">{message || "Não foi possível carregar o perfil."}</div>;

    const imageUrl = previewImage || (profile?.imagem_url ? `${apiUrl}/${profile.imagem_url}?t=${new Date().getTime()}` : '/assets/default-avatar.png');

    return (
        <div className="profile-page-container">
            <h1>{isFirstLogin ? 'Complete Seu Cadastro' : 'Meu Perfil'}</h1>
            <form onSubmit={handleSubmit}>
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-wrapper">
                            <img src={imageUrl} alt="Foto de Perfil" className="profile-avatar" />
                            {isEditing && (
                                <label htmlFor="avatar-upload" className="avatar-edit-button">
                                    <FiCamera />
                                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>
                        <h2>{profile.nome || profile.nome_empresa}</h2>
                        <p>{profile.email_login}</p>
                    </div>

                    <div className="profile-form">
                        {isFirstLogin && <p className="section-description">Para sua segurança, por favor, defina uma nova senha e complete/revise seus dados abaixo.</p>}
                        
                        {/* Renderização dinâmica dos campos baseada no role */}
                        <DynamicFormFields profile={profile} handleChange={handleChange} isEditing={isEditing} />

                        {/* --- SEÇÃO DE ALTERAÇÃO DE SENHA --- */}
                        {isEditing && (
                            <>
                                <h4 className="form-section-title">Segurança</h4>
                                {!isChangingPassword ? (
                                    <button type="button" className="btn-link-style" onClick={() => setIsChangingPassword(true)}>
                                        Alterar Senha
                                    </button>
                                ) : (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="newPassword">Nova Senha</label>
                                            <div className="password-input-wrapper">
                                                <FiLock className="password-icon" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="newPassword"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required={isFirstLogin}
                                                    minLength={6}
                                                    placeholder="Mínimo de 6 caracteres"
                                                    className="form-input"
                                                />
                                                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                                             <div className="password-input-wrapper">
                                                <FiLock className="password-icon" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="confirmPassword"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required={isFirstLogin}
                                                    placeholder="Repita a nova senha"
                                                    className="form-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>
                                    <FiXCircle /> Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <FiSave /> Salvar Alterações
                                </button>
                            </>
                        ) : (
                            <button type="button" className="btn btn-primary" onClick={handleEditClick}>
                               <FiEdit /> Editar Perfil
                            </button>
                        )}
                    </div>
                </div>
            </form>
             {message && <p className={message.startsWith('Erro') ? 'error-message' : 'success-message'} style={{marginTop: '15px', textAlign: 'center'}}>{message}</p>}
        </div>
    );
};

// --- COMPONENTE AUXILIAR PARA OS CAMPOS DO FORMULÁRIO ---
const DynamicFormFields = ({ profile, handleChange, isEditing }: { profile: ProfileData, handleChange: any, isEditing: boolean }) => {
    const renderInput = (name: string, label: string, type = 'text') => (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <input 
                type={type} 
                id={name} 
                name={name} 
                value={profile[name] ? (type === 'date' ? profile[name].split('T')[0] : profile[name]) : ''} 
                onChange={handleChange} 
                disabled={!isEditing} 
                className="form-input" 
            />
        </div>
    );

    const renderTextarea = (name: string, label: string) => (
         <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label htmlFor={name}>{label}</label>
            <textarea 
                id={name} 
                name={name} 
                value={profile[name] || ''} 
                onChange={handleChange} 
                disabled={!isEditing} 
                className="form-input"
                rows={3}
            />
        </div>
    );

    switch (profile.role) {
        case 'ADM':
            return (
                <div className="form-grid">
                    {renderInput('nome', 'Nome Completo')}
                    {renderInput('email', 'Email de Contato', 'email')}
                    {renderInput('cpf', 'CPF')}
                    {renderInput('cnpj', 'CNPJ')}
                    {renderInput('telefone', 'Telefone', 'tel')}
                    {renderInput('data_nascimento', 'Data de Nascimento', 'date')}
                    {renderInput('genero', 'Gênero')}
                    {renderInput('endereco', 'Endereço')}
                    {renderInput('profissao', 'Profissão')}
                </div>
            );
        case 'PROFISSIONAL':
            return (
               <div className="form-grid">
                   {renderInput('nome', 'Nome Completo')}
                   {renderInput('email', 'Email de Contato', 'email')}
                   {renderInput('cpf', 'CPF')}
                   {renderInput('cnpj', 'CNPJ')}
                   {renderInput('telefone', 'Telefone', 'tel')}
                   {renderInput('data_nascimento', 'Data de Nascimento', 'date')}
                   {renderInput('genero', 'Gênero')}
                   {renderInput('endereco', 'Endereço')}
                   {renderInput('cidade', 'Cidade')}
                   {renderInput('profissao', 'Profissão')}
                   {renderInput('modalidade_atendimento', 'Modalidade Atendimento')}
                   {renderInput('especialidade', 'Especialidade')}
                   {renderInput('tipo_acompanhamento', 'Tipo de Acompanhamento')}
                   {renderTextarea('experiencia', 'Experiência')}
                   {renderTextarea('abordagem', 'Abordagem')}
               </div>
           );
        case 'PACIENTE':
            return (
               <div className="form-grid">
                   {renderInput('nome', 'Nome Completo')}
                   {renderInput('cpf', 'CPF')}
                   {renderInput('telefone', 'Telefone', 'tel')}
                   {renderInput('profissao', 'Profissão')}
                   {renderInput('renda', 'Renda')}
                   {renderInput('preferencia_gen_atend', 'Preferência de Gênero (Atendimento)')}
                   {renderInput('data_nascimento', 'Data de Nascimento', 'date')}
                   {renderInput('genero', 'Gênero')}
                   {renderInput('endereco', 'Endereço')}
                   {renderInput('cidade', 'Cidade')}
                   {renderInput('tipo_atendimento', 'Tipo de Atendimento')}
                   {renderInput('modalidade_atendimento', 'Modalidade de Atendimento')}
               </div>
           );
        case 'EMPRESA':
            return (
                <div className="form-grid">
                    {renderInput('nome_empresa', 'Nome da Empresa')}
                    {renderInput('cnpj', 'CNPJ')}
                    {renderInput('num_colaboradores', 'Nº de Colaboradores', 'number')}
                    {renderInput('nome_responsavel', 'Nome do Responsável')}
                    {renderInput('cargo', 'Cargo do Responsável')}
                    {renderInput('telefone', 'Telefone de Contato', 'tel')}
                    {renderInput('email_contato', 'Email de Contato', 'email')}
                    {renderInput('tipo_atendimento', 'Tipo de Atendimento')}
                    {renderInput('frequencia', 'Frequência')}
                    {renderTextarea('descricao', 'Descrição')}
                    {renderTextarea('expectativa', 'Expectativa')}
                </div>
            );
        default:
            return <p>Este tipo de perfil não possui campos editáveis.</p>;
    }
};

export default ProfileAdm;