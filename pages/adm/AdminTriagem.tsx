// src/pages/adm/AdminTriagem.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/Triagem.css';
import { FiUser, FiUsers, FiBriefcase, FiUserCheck, FiArrowLeft, FiTrash2, FiCheckCircle, FiCalendar, FiXCircle, FiRefreshCw, FiDownload, FiMail, FiX } from 'react-icons/fi';
import { IoLogoWhatsapp } from "react-icons/io5";

// Componentes de Modal importados
import TriagemDetailModal from './TriagemDetailModal';
import SchedulingModal from './SchedulingModal';
import ConfirmationModal from '../ConfirmationModal'; // <-- Modal de confirmação importado

// --- MODAL PARA O HISTÓRICO ---
const HistoryDetailModal = ({ isOpen, onClose, item }) => {
    if (!isOpen) return null;
    const whatsappLink = `https://wa.me/55${item.telefone_usuario?.replace(/\D/g, '')}`;
    const mailtoLink = `mailto:${item.email_usuario}`;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content triagem-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Detalhes do Histórico</h2>
                    <button onClick={onClose} className="modal-close-btn"><FiX /></button>
                </div>
                <div className="modal-body">
                    <div className="detail-item"><span className="detail-label">Nome</span><span className="detail-value">{item.nome_usuario}</span></div>
                    <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{item.email_usuario}</span></div>
                    <div className="detail-item"><span className="detail-label">Telefone</span><span className="detail-value">{item.telefone_usuario}</span></div>
                    <div className="detail-item"><span className="detail-label">Perfil</span><span className="detail-value">{item.role_usuario}</span></div>
                    <div className="detail-item"><span className="detail-label">Status Final</span><span className="detail-value">{item.status_final}</span></div>
                    <div className="detail-item"><span className="detail-label">Data da Migração</span><span className="detail-value">{new Date(item.data_migracao).toLocaleString('pt-BR')}</span></div>
                </div>
                <div className="modal-actions">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><IoLogoWhatsapp/> WhatsApp</a>
                    <a href={mailtoLink} className="btn-email"><FiMail/> E-mail</a>
                </div>
            </div>
        </div>
    );
};

const AdminTriagem = () => {
    // Estados existentes
    const [summary, setSummary] = useState({ pacientes: 0, profissionais: 0, empresas: 0 });
    const [list, setList] = useState([]);
    const [notConfirmedList, setNotConfirmedList] = useState([]);
    const [scheduledList, setScheduledList] = useState([]);
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [view, setView] = useState('summary');
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
    const [userToSchedule, setUserToSchedule] = useState(null);
    const [history, setHistory] = useState([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const navigate = useNavigate();

    // --- NOVO ESTADO PARA GERENCIAR O MODAL DE CONFIRMAÇÃO ---
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmButtonType: 'primary'
    });
    
    // Hooks de Memoização para API e Token
    const token = useMemo(() => localStorage.getItem('token'), []);
    const api = useMemo(() => axios.create({ baseURL: 'http://localhost:3001/api/triagem', headers: { 'Authorization': `Bearer ${token}` } }), [token]);
    const apiScheduling = useMemo(() => axios.create({ baseURL: 'http://localhost:3001/api/scheduling', headers: { 'Authorization': `Bearer ${token}` } }), [token]);

    // --- FUNÇÕES AUXILIARES PARA CONTROLAR O MODAL ---
    const openModal = ({ title, message, onConfirm, confirmButtonType = 'primary' }) => {
        setModalState({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                closeModal();
            },
            confirmButtonType
        });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmButtonType: 'primary' });
    };

    // Função para buscar todos os dados
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, notConfirmedRes, scheduledRes, pendingRes, historyRes, slotsRes] = await Promise.all([
                api.get('/summary'),
                api.get('/nao-confirmados'),
                apiScheduling.get('/scheduled'),
                apiScheduling.get('/pending'),
                api.get('/history'),
                apiScheduling.get('/availability/public')
            ]);
            setSummary(summaryRes.data);
            setNotConfirmedList(notConfirmedRes.data);
            setScheduledList(scheduledRes.data);
            setPendingAppointments(pendingRes.data);
            setHistory(historyRes.data);
            setAvailableSlots(slotsRes.data);
        } catch (error) {
            console.error("Erro ao buscar dados da triagem:", error);
        } finally {
            setLoading(false);
        }
    }, [api, apiScheduling]);

    useEffect(() => {
        if (view === 'summary') {
            fetchAllData();
        }
    }, [view, fetchAllData]);

    const handleOpenHistoryModal = (item) => {
        setSelectedHistoryItem(item);
        setIsHistoryModalOpen(true);
    };
    
    const handleDownloadHistory = () => {
        const doc = new jsPDF();
        doc.text("Histórico de Triagens Concluídas", 14, 16);
        autoTable(doc, {
            startY: 22,
            head: [['Data', 'Nome', 'Email', 'Telefone', 'Perfil']],
            body: history.map((item) => [ new Date(item.data_migracao).toLocaleDateString('pt-BR'), item.nome_usuario, item.email_usuario, item.telefone_usuario, item.role_usuario ]),
        });
        doc.save('historico_triagens.pdf');
    };

    const fetchList = async (type) => {
        setLoading(true);
        setView(type);
        try {
            const response = await api.get(`/list/${type}`);
            setList(response.data);
        } catch (error) {
            console.error(`Erro ao buscar lista de ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    // --- FUNÇÕES DE LÓGICA REFATORADAS COM MODAL ---

    const handleStatusChange = async (type, id, newStatus) => {
        const listToUpdate = view === 'summary' ? notConfirmedList : list;
        const setListToUpdate = view === 'summary' ? setNotConfirmedList : setList;
        const originalList = [...listToUpdate];
        const updatedList = listToUpdate.filter(item => item.id !== id);
        setListToUpdate(updatedList);
        
        try {
            await api.patch(`/status/${type}/${id}`, { status: newStatus });
            if (newStatus === 'Pendente') { // Recarrega os dados do resumo se algo for movido para pendente
                fetchAllData();
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            setListToUpdate(originalList);
            openModal({ title: 'Erro', message: 'Falha ao atualizar o status. Tente novamente.' });
        }
    };
    
    const handleDelete = (type, id, nome) => {
        openModal({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja apagar permanentemente o registro de ${nome}? Esta ação não pode ser desfeita.`,
            confirmButtonType: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/${type}/${id}`);
                    await fetchAllData();
                } catch (error) {
                    openModal({ title: 'Erro', message: 'Falha ao apagar o registro. Tente novamente.' });
                }
            }
        });
    };

    const handleOpenModal = async (type, id) => {
        try {
            const response = await api.get(`/detail/${type}/${id}`);
            setSelectedItem({ ...response.data, type: type });
            setIsModalOpen(true);
        } catch (error) {
            console.error("Erro ao buscar detalhes:", error);
            openModal({ title: 'Erro', message: 'Falha ao buscar detalhes do usuário.' });
        }
    };

    const handleConfirmRegistration = (type, id) => {
        openModal({
            title: 'Confirmar Cadastro',
            message: 'Tem certeza que deseja confirmar este cadastro? Esta ação criará uma conta de usuário oficial e moverá o registro para o arquivo.',
            onConfirm: async () => {
                try {
                    const response = await api.post(`/confirm/${type}/${id}`);
                    openModal({
                        title: 'Cadastro Realizado!',
                        message: `${response.data.message}\nSenha temporária gerada: ${response.data.tempPassword}\n\nPor favor, informe o novo usuário.`,
                    });
                    await fetchAllData();
                    if (view !== 'summary') await fetchList(view);
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Falha ao confirmar o cadastro.';
                    openModal({ title: 'Erro', message: `Erro: ${errorMessage}` });
                }
            }
        });
    };

    const handleOpenSchedulingModal = (item) => {
        setUserToSchedule({ ...item, view: view });
        setIsSchedulingModalOpen(true);
    };

    const handleRescheduleAppointment = async (appointmentId, newSlotId, newLink) => {
        try {
            await apiScheduling.patch(`/appointments/${appointmentId}/reschedule`, { new_availability_id: newSlotId, meeting_link: newLink });
            fetchAllData();
            openModal({ title: 'Sucesso', message: 'Agendamento reagendado com sucesso!' });
        } catch (error) {
            openModal({ title: 'Erro', message: 'Falha ao reagendar a reunião.' });
        }
    };

    const handleCancelAppointment = (appointmentId) => {
        openModal({
            title: 'Cancelar Agendamento',
            message: 'Tem certeza que deseja cancelar este agendamento? Ele voltará para a lista de pendentes e o horário será liberado.',
            confirmButtonType: 'danger',
            onConfirm: async () => {
                try {
                    await apiScheduling.patch(`/appointments/${appointmentId}/cancel`);
                    fetchAllData();
                    openModal({ title: 'Sucesso', message: 'Agendamento cancelado com sucesso.' });
                } catch (error) {
                    openModal({ title: 'Erro', message: 'Falha ao cancelar o agendamento.' });
                }
            }
        });
    };

    const handleConfirmAppointment = async (appointmentId, meetingLink) => {
        try {
            await apiScheduling.patch(`/appointments/${appointmentId}/confirm`, { meeting_link: meetingLink });
            fetchAllData();
            openModal({ title: 'Sucesso', message: 'Agendamento confirmado com sucesso!' });
        } catch (error) {
            console.error("Erro ao confirmar agendamento:", error);
            openModal({ title: 'Erro', message: 'Falha ao confirmar o agendamento.' });
        }
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO (JSX) ---

    const renderSummary = () => (
        <div className="triagem-summary-grid">
            <div className="triagem-summary-card" onClick={() => fetchList('pacientes')}><FiUsers size={32} /><h3>Pacientes</h3><p><span>{summary.pacientes}</span> pendentes</p></div>
            <div className="triagem-summary-card" onClick={() => fetchList('profissionais')}><FiUserCheck size={32} /><h3>Profissionais</h3><p><span>{summary.profissionais}</span> pendentes</p></div>
            <div className="triagem-summary-card" onClick={() => fetchList('empresas')}><FiBriefcase size={32} /><h3>Empresas</h3><p><span>{summary.empresas}</span> pendentes</p></div>
        </div>
    );

    const renderList = () => (
        <div>
            <button className="btn-back" onClick={() => setView('summary')}><FiArrowLeft /> Voltar ao Resumo</button>
            <div className="table-wrapper">
                <table className="user-table triagem-list-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Data de Envio</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((item) => (
                            <tr key={item.id}>
                                <td onClick={() => handleOpenModal(view, item.id)}>{item.nome}</td>
                                <td onClick={() => handleOpenModal(view, item.id)}>{item.email}</td>
                                <td onClick={() => handleOpenModal(view, item.id)}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <select className={`status-select status-${item.status.toLowerCase().replace(' ', '-')}`} value={item.status} onChange={(e) => handleStatusChange(view, item.id, e.target.value)} onClick={(e) => e.stopPropagation()}>
                                        <option value="Pendente">Pendente</option>
                                        <option value="Agendado">Agendado</option>
                                        <option value="Confirmado">Confirmado</option>
                                        <option value="Não confirmado">Não confirmado</option>
                                    </select>
                                </td>
                                <td className="actions-cell" style={{ textAlign: 'right' }}>
                                    {item.status === 'Agendado' && (
                                        <button className="action-btn-triagem schedule" onClick={(e) => { e.stopPropagation(); handleOpenSchedulingModal(item); }}><FiCalendar /> Enviar Link</button>
                                    )}
                                    {item.status === 'Confirmado' && (
                                        <button className="action-btn-triagem confirm" title="Confirmar Cadastro e Criar Usuário" onClick={(e) => { e.stopPropagation(); handleConfirmRegistration(view, item.id); }}><FiCheckCircle /> Migrar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderScheduledSection = () => (
        <div className="management-section" style={{ marginTop: '32px' }}>
             <div className="management-header"><h2>Reuniões Agendadas</h2></div>
            <div className="triagem-scheduled-grid">
                {scheduledList.length > 0 ? scheduledList.map(item => (
                    <div key={item.id} className="scheduled-card">
                        <div className="scheduled-card-clickable-area" onClick={() => handleOpenModal(item.triagem_type, item.triagem_id)}>
                            <div className="scheduled-card-header"><h4>{item.user_name}</h4><span className={`role-badge ${item.triagem_type.slice(0, -1)}`}>{item.triagem_type.slice(0, -1)}</span></div>
                            <div className="scheduled-card-body"><p><FiCalendar /> {new Date(item.start_time).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</p></div>
                        </div>
                        <div className="card-actions">
                            <button className="action-btn-triagem schedule" onClick={() => handleOpenSchedulingModal(item)}><FiRefreshCw /> Reagendar</button>
                             <button className="action-btn-triagem delete" onClick={() => handleCancelAppointment(item.id)} title="Cancelar Agendamento"><FiXCircle /> Cancelar</button>
                        </div>
                    </div>
                )) : <p>Nenhum agendamento futuro.</p>}
            </div>
        </div>
    );
    
    const renderNotConfirmedSection = () => (
        <div className="management-section" style={{ marginTop: '32px' }}>
             <div className="management-header not-confirmed-header"><h2>Usuários Não Confirmados</h2></div>
            <div className="table-wrapper">
                <table className="user-table triagem-list-table">
                     <thead><tr><th>Nome</th><th>Email</th><th>Categoria</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                    <tbody>
                        {notConfirmedList.map(item => {
                            const categoria = item.type === 'profissionais' ? 'profissional' : item.type.slice(0, -1);
                            const capitalizedCategoria = categoria.charAt(0).toUpperCase() + categoria.slice(1);
                            return (
                                <tr key={`${item.type}-${item.id}`}>
                                    <td onClick={() => handleOpenModal(item.type, item.id)}>{item.nome}</td>
                                    <td onClick={() => handleOpenModal(item.type, item.id)}>{item.email}</td>
                                    <td><span className={`role-badge ${categoria}`}>{capitalizedCategoria}</span></td>
                                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                                        <button className="action-btn-triagem move" title="Mover para Pendente" onClick={(e) => { e.stopPropagation(); handleStatusChange(item.type, item.id, 'Pendente'); }}><FiRefreshCw /></button>
                                        <button className="action-btn-triagem delete" title="Apagar Permanentemente" onClick={(e) => { e.stopPropagation(); handleDelete(item.type, item.id, item.nome); }}><FiTrash2 /></button>
                                    </td>
                                </tr>
                            );
                        })}
                         {notConfirmedList.length === 0 && (
                            <tr><td colSpan="4" style={{textAlign: 'center'}}>Nenhum cadastro não confirmado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const renderPendingConfirmationSection = () => (
        <div className="management-section" style={{ marginTop: '32px' }}>
             <div className="management-header"><h2>Solicitação de Agendamentos</h2></div>
            
            <div className="triagem-scheduled-grid">
                 {pendingAppointments.length > 0 ? pendingAppointments.map(item => (
                    <div key={item.id} className="scheduled-card pending">
                        <div className="scheduled-card-header"><h4>{item.user_name}</h4><span className={`role-badge ${item.triagem_type.slice(0, -1)}`}>{item.triagem_type.slice(0, -1)}</span></div>
                        <div className="scheduled-card-body"><p><FiCalendar /> Horário solicitado: {new Date(item.start_time).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</p></div>
                        <div className="card-actions">
                            <button className="action-btn confirm-btn" onClick={() => handleOpenSchedulingModal(item)}><FiCheckCircle /> Confirmar</button>
                        </div>
                    </div>
                )) : <p>Nenhuma solicitação de agendamento pendente.</p>}
            </div>
        </div>
    );
    
    const renderHistoryPanel = () => (
        <div className="management-section history-panel">
            <div className="management-header">
                <h2> Arquivo de Triagens</h2>
                <div className="header-actions"><button className="btn-action-history" onClick={handleDownloadHistory}><FiDownload/> Baixar Histórico (PDF)</button></div>
            </div>
            <div className="table-wrapper">
                <table className="user-table">
                    <thead><tr><th>Data Migração</th><th>Nome</th><th>Email</th><th>Perfil</th><th style={{textAlign: 'right'}}>Ações</th></tr></thead>
                    <tbody>
                        {history.length > 0 ? history.map(item => (
                            <tr key={item.id}>
                                <td>{new Date(item.data_migracao).toLocaleDateString('pt-BR')}</td>
                                <td>{item.nome_usuario}</td>
                                <td>{item.email_usuario}</td>
                                <td><span className={`role-badge ${item.role_usuario?.toLowerCase()}`}>{item.role_usuario}</span></td>
                                <td style={{textAlign: 'right'}}><button className="action-btn contact-btn" onClick={() => handleOpenHistoryModal(item)} title="Visualizar Contato" ><FiUser /></button></td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} style={{textAlign: 'center'}}>Nenhum registro no histórico.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // --- RENDERIZAÇÃO PRINCIPAL DO COMPONENTE ---
    return (
        <>
            {/* O modal de confirmação é renderizado aqui e controlado pelo estado */}
            <ConfirmationModal 
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
                message={modalState.message}
                confirmButtonType={modalState.confirmButtonType}
            />

            <HistoryDetailModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} item={selectedHistoryItem} />
            <SchedulingModal isOpen={isSchedulingModalOpen} onClose={() => setIsSchedulingModalOpen(false)} user={userToSchedule} api={apiScheduling} onConfirm={handleConfirmAppointment} onReschedule={handleRescheduleAppointment} availableSlots={availableSlots} onNavigateToAgenda={() => navigate('/admin/agenda')} />
            <TriagemDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} item={selectedItem} onUpdateAppointment={() => {}} />
            
            <div className="management-section">
                <div className="management-header"><h2>Painel de Controle</h2></div>
                {loading ? <p>Carregando...</p> : view === 'summary' ? renderSummary() : renderList()}
            </div>
            {!loading && view === 'summary' && renderPendingConfirmationSection()}
            {!loading && view === 'summary' && renderScheduledSection()}
            {!loading && view === 'summary' && renderNotConfirmedSection()}
            {view === 'summary' && renderHistoryPanel()}
        </>
    );
};

export default AdminTriagem;