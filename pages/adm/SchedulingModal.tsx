// src/pages/adm/SchedulingModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiCalendar, FiLink, FiSend, FiAlertTriangle, FiCopy, FiCheck, FiMessageCircle, FiMail, FiRefreshCw } from 'react-icons/fi';
import { IoLogoWhatsapp } from "react-icons/io5";
import '../../styles/Triagem.css';

const SchedulingModal = ({ isOpen, onClose, user, api, onConfirm, onReschedule, availableSlots, onNavigateToAgenda }) => {
    const [meetingLink, setMeetingLink] = useState('');
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [emailStatus, setEmailStatus] = useState('');
    const [copied, setCopied] = useState(false);

    // Determina o modo do modal:
    // 'invite' -> Admin precisa enviar o link para o usuário agendar.
    // 'confirm' -> Usuário já escolheu um horário e admin precisa confirmar/reagendar.
    const mode = useMemo(() => (user && user.start_time) ? 'confirm' : 'invite', [user]);

    const publicScheduleLink = useMemo(() => 
        `http://localhost:5173/schedule-appointment?triagem_id=${user?.id}&type=${user?.view}&name=${encodeURIComponent(user?.nome)}&email=${encodeURIComponent(user?.email)}`,
    [user]);
    
    // Reseta o estado interno sempre que o modal abre com um novo usuário.
    useEffect(() => {
        if (isOpen) {
            setMeetingLink(user?.meeting_link || '');
            setSelectedSlotId('');
            setEmailStatus('');
            setCopied(false);
        }
    }, [isOpen, user]);

    // Se o modal não estiver aberto, não renderiza nada.
    if (!isOpen || !user) return null;
    
    // --- Handlers ---
    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicScheduleLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSendEmail = async () => {
        setEmailStatus('Enviando...');
        try {
            await api.post('/send-schedule-link', {
                email: user.email,
                name: user.nome,
                scheduleLink: publicScheduleLink,
            });
            setEmailStatus('E-mail enviado!');
        } catch (error) {
            console.error("Falha ao enviar e-mail:", error);
            setEmailStatus('Falha ao enviar.');
        } finally {
            setTimeout(() => setEmailStatus(''), 3000);
        }
    };

    const handleSubmit = () => {
        if (selectedSlotId) { // Se um novo slot foi escolhido, é um reagendamento
            if (!meetingLink) {
                alert('O link da reunião é obrigatório para reagendar.');
                return;
            }
            onReschedule(user.id, selectedSlotId, meetingLink);
        } else { // Senão, é uma confirmação normal
             if (!meetingLink) {
                alert('Por favor, insira o link da reunião para confirmar.');
                return;
            }
            onConfirm(user.id, meetingLink);
        }
        onClose();
    };

    // --- RENDERIZAÇÃO ---
    
    // Aviso de horários indisponíveis
    if (mode === 'confirm' && (!availableSlots || availableSlots.length === 0)) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2><FiAlertTriangle color="#f59e0b" /> Horários Indisponíveis</h2>
                        <button onClick={onClose} className="modal-close-btn"><FiX /></button>
                    </div>
                    <div className="modal-body">
                        <p>Não há horários de triagem disponíveis para reagendamento no momento.</p>
                        <p>Vá para a página de Agenda para definir novos horários antes de reagendar.</p>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-primary" onClick={onNavigateToAgenda}>
                            <FiCalendar /> Ir para Agenda
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const messageBody = `Olá, ${user.nome}! Recebemos sua solicitação. Por favor, acesse o link para escolher o melhor horário para sua entrevista: ${publicScheduleLink}`;
    const whatsappLink = `https://wa.me/55${user.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(messageBody)}`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content scheduling-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{mode === 'confirm' ? 'Confirmar / Reagendar' : 'Enviar Convite de Agendamento'}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <p className="scheduling-intro">Para: <strong>{user.user_name || user.nome}</strong></p>

                    {mode === 'invite' && (
                        <div className="scheduling-step">
                            <div className="step-content">
                                <h4>Enviar Link de Agendamento</h4>
                                <p>Envie o link abaixo para que a pessoa possa escolher o melhor horário disponível.</p>
                                <div className="link-actions">
                                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-action whatsapp"><IoLogoWhatsapp/> WhatsApp</a>
                                    <button onClick={handleSendEmail} className="btn-action email" disabled={!!emailStatus}><FiMail/> {emailStatus || 'Enviar por E-mail'}</button>
                                    <button onClick={handleCopyLink} className="btn-action copy">{copied ? <><FiCheck/> Copiado!</> : <><FiCopy/> Copiar Link</>}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'confirm' && (
                        <div className="scheduling-step">
                            <div className="step-content">
                                <h4>Confirmar ou Reagendar</h4>
                                <p>Horário solicitado: <strong>{new Date(user.start_time).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</strong></p>
                                
                                <div className="form-group">
                                    <label><FiRefreshCw /> Alterar Horário (opcional)</label>
                                    <select className="schedule-select" value={selectedSlotId} onChange={(e) => setSelectedSlotId(e.target.value)}>
                                        <option value="">Manter horário atual</option>
                                        {availableSlots.map(slot => (
                                            <option key={slot.id} value={slot.id}>
                                                {new Date(slot.start_time).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><FiLink /> Link da Reunião (obrigatório)</label>
                                    <input type="text" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/seu-link" required/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {mode === 'confirm' && (
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSubmit} disabled={!meetingLink}>
                            {selectedSlotId ? <><FiRefreshCw/> Reagendar e Notificar</> : <><FiSend/> Confirmar e Enviar</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchedulingModal;