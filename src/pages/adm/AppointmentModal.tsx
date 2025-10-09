// src/pages/adm/AppointmentModal.tsx
import { useState, FormEvent, useEffect } from 'react';
import { FiCalendar, FiSave } from 'react-icons/fi'; // Importa os ícones necessários

const AppointmentModal = ({ isOpen, onClose, onSave, professionals, patients, companies, initialData }) => {
    const [patientId, setPatientId] = useState('');
    const [professionalId, setProfessionalId] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [sessionValue, setSessionValue] = useState('');
    const [frequency, setFrequency] = useState('Evento Único');
    const [appointmentTime1, setAppointmentTime1] = useState('');
    const [appointmentTime2, setAppointmentTime2] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Preenche o formulário para edição
                setPatientId(initialData.patient_id || '');
                setProfessionalId(initialData.professional_id || '');
                setCompanyId(initialData.company_id || '');
                setSessionValue(initialData.session_value || '');
                setFrequency(initialData.frequency || 'Evento Único');
                const date = new Date(initialData.appointment_time);
                // Ajuste para o fuso horário local ao exibir no input
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                setAppointmentTime1(date.toISOString().slice(0, 16));
                setAppointmentTime2('');
            } else {
                // Limpa o formulário para criação
                setPatientId('');
                setProfessionalId('');
                setCompanyId('');
                setSessionValue('');
                setFrequency('Evento Único');
                setAppointmentTime1('');
                setAppointmentTime2('');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const appointmentTimes = [appointmentTime1, appointmentTime2].filter(Boolean);
        if (appointmentTimes.length === 0) {
            alert('Por favor, defina pelo menos uma data para o agendamento.');
            return;
        }
        onSave({
            patient_id: patientId,
            professional_id: professionalId,
            company_id: companyId || null,
            session_value: sessionValue || null,
            frequency: frequency,
            appointment_times: appointmentTimes,
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{initialData ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
                    {/* Botão de fechar pode ser melhorado com um ícone, mas o '&times;' funciona */}
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-form">
                    {/* Seção de Participantes */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="patient-select">Paciente*</label>
                            <select id="patient-select" value={patientId} onChange={e => setPatientId(e.target.value)} required>
                                <option value="">Selecione um paciente</option>
                                {patients.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                         <div className="form-group">
                            <label htmlFor="professional-select">Profissional*</label>
                            <select id="professional-select" value={professionalId} onChange={e => setProfessionalId(e.target.value)} required>
                                <option value="">Selecione um profissional</option>
                                {professionals.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="company-select">Vincular à Empresa (Opcional)</label>
                            <select id="company-select" value={companyId} onChange={e => setCompanyId(e.target.value)}>
                                <option value="">Nenhuma</option>
                                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.nome_empresa}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="session-value">Valor da Sessão (R$)</label>
                            <input id="session-value" type="number" step="0.01" placeholder="Ex: 150.00" value={sessionValue} onChange={e => setSessionValue(e.target.value)} />
                        </div>
                    </div>
                    
                    {/* Seção de Horários */}
                    <h4>Horários e Frequência</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="datetime-1">Data e Hora 1*</label>
                            <div className="input-with-icon">
                                <input id="datetime-1" type="datetime-local" value={appointmentTime1} onChange={e => setAppointmentTime1(e.target.value)} required />
                                <FiCalendar className="input-icon" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="datetime-2">Data e Hora 2 (Opcional)</label>
                            <div className="input-with-icon">
                                <input id="datetime-2" type="datetime-local" value={appointmentTime2} onChange={e => setAppointmentTime2(e.target.value)} />
                                <FiCalendar className="input-icon" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="frequency-select">Repetir Evento</label>
                            <select id="frequency-select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                                <option value="Evento Único">Evento Único</option>
                                <option value="Semanalmente">Semanalmente</option>
                                <option value="A Cada 15 Dias">A Cada 15 Dias</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-new-user secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-new-user">
                            <FiSave /> Salvar Agendamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;