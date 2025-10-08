// src/pages/adm/TriagemDetailModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf'; // Importa a biblioteca para gerar PDF
import '../../styles/Triagem.css';
import { FiX, FiMail, FiDownload, FiCalendar, FiLink, FiEdit, FiSave, FiRefreshCw } from 'react-icons/fi';
import { IoLogoWhatsapp } from "react-icons/io5";

// Componente auxiliar para exibir um item de detalhe
const DetailItem = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    const displayValue = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value);
    return (
        <div className="detail-item">
            <span className="detail-label">{label}</span>
            <span className="detail-value">{displayValue}</span>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DO MODAL ---
const TriagemDetailModal = ({ isOpen, onClose, item, onUpdateAppointment, onRescheduleAppointment }) => {
    if (!isOpen || !item) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [meetingLink, setMeetingLink] = useState(item.meeting_link || '');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const token = useMemo(() => localStorage.getItem('token'), []);

    const apiScheduling = useMemo(() => axios.create({
        baseURL: 'http://localhost:3001/api/scheduling',
        headers: { 'Authorization': `Bearer ${token}` }
    }), [token]);

    // Reseta o estado de edição quando o modal abre ou o item muda
    useEffect(() => {
        setIsEditing(false);
        setMeetingLink(item.meeting_link || '');
        setSelectedSlotId('');
    }, [item]);

    // Busca os horários disponíveis quando o admin clica para editar
    useEffect(() => {
        if (isEditing) {
            const fetchAvailability = async () => {
                try {
                    const response = await apiScheduling.get('/availability/public');
                    setAvailableSlots(response.data);
                } catch (error) {
                    console.error("Erro ao buscar horários para reagendamento:", error);
                }
            };
            fetchAvailability();
        }
    }, [isEditing, apiScheduling]);

    // Função para salvar as alterações do agendamento
    const handleSave = () => {
        if (selectedSlotId) {
            // Se um novo horário foi selecionado, é um reagendamento
            onRescheduleAppointment(item.id, selectedSlotId, meetingLink);
        } else {
            // Senão, é apenas uma atualização do link
            onUpdateAppointment(item.id, meetingLink);
        }
        setIsEditing(false);
    };

    // Função para gerar e baixar o formulário em PDF
    const handleDownload = () => {
        const doc = new jsPDF();
        let y = 15;
        const lineHeight = 7;
        const margin = 10;

        doc.setFontSize(18);
        doc.text(`Detalhes da Triagem - ${item.triagem_type.toUpperCase()}`, margin, y);
        y += lineHeight * 2;
        doc.setFontSize(12);

        const addDetailLine = (label, value) => {
            if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return;
            const text = `${label}: ${typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value}`;
            const splitText = doc.splitTextToSize(text, 180);
            doc.text(splitText, margin, y);
            y += (splitText.length * lineHeight);
        };
        
        // Adiciona os detalhes com base no tipo de usuário
        switch(item.triagem_type) {
            case 'pacientes':
                addDetailLine("Nome", item.nome_completo);
                addDetailLine("Email", item.email);
                addDetailLine("Telefone", item.telefone);
                addDetailLine("Gênero", item.genero);
                addDetailLine("Cidade", item.cidade);
                addDetailLine("Profissão", item.profissao);
                addDetailLine("Renda Familiar", item.renda_familiar);
                addDetailLine("Modalidade", item.modalidade);
                addDetailLine("Preferência (Gênero Profissional)", item.preferencia_genero_profissional);
                addDetailLine("Terapias Buscadas", item.terapia_buscada?.join(', '));
                addDetailLine("Feedback/Dúvidas", item.feedback_questionario);
                addDetailLine("Concordou com os Termos", item.concorda_termos);
                break;
            case 'profissionais':
                addDetailLine("Nome", item.nome_completo);
                addDetailLine("Email", item.email);
                addDetailLine("Telefone", item.telefone);
                addDetailLine("Cidade", item.cidade);
                addDetailLine("Nível", item.nivel_profissional);
                addDetailLine("Aluno Távola", item.aluno_tavola);
                addDetailLine("Modalidade", item.modalidade);
                addDetailLine("Especialidade", item.especialidade);
                addDetailLine("Formação", item.instituicao_formacao);
                addDetailLine("Faz Supervisão", item.faz_supervisao);
                addDetailLine("Faz Análise Pessoal", item.faz_analise_pessoal);
                addDetailLine("Abordagens", item.palavras_chave_abordagens);
                break;
            case 'empresas':
                addDetailLine("Nome da Empresa", item.nome_empresa);
                addDetailLine("Email de Contato", item.email);
                addDetailLine("CNPJ", item.cnpj);
                addDetailLine("Nº de Colaboradores", item.num_colaboradores);
                addDetailLine("Nome do Responsável", item.nome_responsavel);
                addDetailLine("Cargo do Responsável", item.cargo_responsavel);
                addDetailLine("Telefone", item.telefone);
                addDetailLine("Demanda", item.caracterizacao_demanda);
                addDetailLine("Tipo de Atendimento", item.tipo_atendimento_desejado?.join(', '));
                addDetailLine("Público-Alvo", item.publico_alvo?.join(', '));
                addDetailLine("Frequência", item.frequencia_desejada);
                addDetailLine("Expectativas", item.expectativas);
                break;
        }

        doc.save(`triagem_${item.triagem_type}_${item.user_name || item.nome_completo}.pdf`);
    };
    
    // Renderiza a seção de agendamento se o item for um agendamento
    const renderScheduledDetails = () => (
        <div className="modal-section scheduled-details-section">
            <h3>Detalhes do Agendamento</h3>
            <div className="detail-item">
                <span className="detail-label"><FiCalendar /> Data e Hora</span>
                <span className="detail-value">{new Date(item.start_time).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</span>
            </div>
            <div className="detail-item">
                <span className="detail-label"><FiLink /> Link da Reunião</span>
                {isEditing ? (
                    <input type="text" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="inline-edit-input" />
                ) : (
                    <span className="detail-value">{item.meeting_link || 'Não definido'}</span>
                )}
            </div>

            {isEditing && (
                <div className="detail-item">
                    <span className="detail-label"><FiRefreshCw /> Reagendar Para</span>
                    <select className="schedule-select" value={selectedSlotId} onChange={(e) => setSelectedSlotId(e.target.value)}>
                        <option value="">Manter horário atual</option>
                        {availableSlots.map(slot => (
                            <option key={slot.id} value={slot.id}>
                                {new Date(slot.start_time).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {isEditing ? (
                <button className="btn-save-inline" onClick={handleSave}><FiSave /> Salvar e Notificar</button>
            ) : (
                <button className="btn-edit-inline" onClick={() => setIsEditing(true)}><FiEdit /> Editar Agendamento</button>
            )}
        </div>
    );

    // Renderiza o conteúdo principal com os detalhes do formulário de triagem
    const renderContent = () => { /* ... (código da função renderContent da resposta anterior) ... */ };

    const phoneNumber = item.telefone?.replace(/\D/g, '');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content triagem-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Detalhes da Triagem</h2>
                    <button onClick={onClose} className="modal-close-btn"><FiX /></button>
                </div>
                <div className="modal-body">
                    {/* Exibe os detalhes do agendamento se o item for um agendamento */}
                    {item.start_time && renderScheduledDetails()}
                    
                    {/* Exibe os detalhes da triagem */}
                    {renderContent()}
                </div>
                <div className="modal-actions">
                    <button onClick={handleDownload} className="btn-download">
                        <FiDownload/> Download (PDF)
                    </button>
                    {phoneNumber && (
                        <a href={`https://wa.me/55${phoneNumber}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                            <IoLogoWhatsapp/> WhatsApp
                        </a>
                    )}
                    {item.email && (
                        <a href={`mailto:${item.email}`} className="btn-email">
                            <FiMail/> Enviar E-mail
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TriagemDetailModal;