// src/ScheduleAppointmentPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './styles/TriagemForm.css'; // Reutilizaremos o estilo

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const ScheduleAppointmentPage = () => {
    const [searchParams] = useSearchParams();
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    const triagem_id = searchParams.get('triagem_id');
    const type = searchParams.get('type');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/scheduling/availability/public`);
                setSlots(response.data);
            } catch (error) {
                setMessage('Não foi possível carregar os horários. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };
        fetchAvailability();
    }, []);

    const handleSubmit = async () => {
        if (!selectedSlot) {
            alert('Por favor, selecione um horário.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/api/scheduling/appointments/public`, {
                availability_id: selectedSlot.id,
                triagem_id,
                triagem_type: type,
                user_name: name,
                user_email: email,
            });
            setMessage(response.data.message);
            setSlots([]); // Limpa os slots para não permitir novo agendamento
        } catch (error) {
            setMessage(error.response?.data?.message || 'Ocorreu um erro ao agendar.');
        } finally {
            setLoading(false);
        }
    };
    
    if (!triagem_id || !type || !name || !email) {
        return <div className="triagem-container"><div className="triagem-card"><p>Link de agendamento inválido.</p></div></div>;
    }

    if (message) {
        return <div className="triagem-container"><div className="triagem-card success-message"><h2>Obrigado!</h2><p>{message}</p></div></div>;
    }

    return (
        <div className="triagem-container">
            <div className="triagem-card">
                <div className="triagem-header">
                    <h1>Agendamento de Triagem</h1>
                    <p>Olá, <strong>{name}</strong>! Por favor, selecione o melhor horário para sua entrevista inicial.</p>
                </div>
                {loading ? <p>Carregando horários...</p> : (
                    <div className="time-slot-selection">
                        <div className="time-slot-grid">
                            {slots.map(slot => (
                                <button 
                                    key={slot.id} 
                                    className={`time-slot-btn ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedSlot(slot)}
                                >
                                    {new Date(slot.start_time).toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})}
                                    <br/>
                                    {new Date(slot.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                                </button>
                            ))}
                        </div>
                        <button className="btn-submit" onClick={handleSubmit} disabled={!selectedSlot || loading}>
                            {loading ? 'Enviando...' : 'Confirmar Horário'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleAppointmentPage;