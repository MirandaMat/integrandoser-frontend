// src/pages/SettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FiSave, FiSun, FiMoon, FiZap } from 'react-icons/fi';
import '../styles/general.css';

type Theme = 'light' | 'dark' | 'colorful';

interface PaymentSettings {
    cpf?: string;
    cnpj?: string;
    pix_token?: string;
}

const SettingsPage = () => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    const [activeTheme, setActiveTheme] = useState<Theme>(
        () => (localStorage.getItem('theme') as Theme) || 'light'
    );

    // Função para buscar todos os dados necessários (perfil e pagamento)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Busca o perfil para saber o role do usuário
            const profileResponse = await fetch('http://localhost:3001/api/profile/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profileData = await profileResponse.json();
            setUserRole(profileData.role);

            // Se for ADM ou Profissional, busca as configurações de pagamento
            if (profileData.role === 'ADM' || profileData.role === 'PROFISSIONAL') {
                const paymentResponse = await fetch('http://localhost:3001/api/users/settings/payment', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const paymentData = await paymentResponse.json();
                setPaymentSettings(paymentData);
            }
        } catch (error) {
            console.error("Erro ao carregar dados da página de configurações:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', activeTheme);
        localStorage.setItem('theme', activeTheme);
    }, [activeTheme]);

    const handleThemeChange = (theme: Theme) => {
        setActiveTheme(theme);
    };

    const handleSavePayment = async () => {
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/users/settings/payment', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pix_token: paymentSettings.pix_token || '' })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage('Chave PIX salva com sucesso!');
        } catch (error: any) {
            setMessage(`Erro ao salvar: ${error.message}`);
        }
    };

    if (loading) {
        return <div>Carregando configurações...</div>;
    }

    return (
        <div className="settings-page-container">
            <h1>Configurações</h1>

            {/* Seção de Pagamento - Renderizada condicionalmente */}
            {(userRole === 'ADM' || userRole === 'PROFISSIONAL') && (
                <div className="settings-card">
                    <h2>Informações de Pagamento</h2>
                    <p className="description">Gerencie suas informações para recebimentos.</p>
                    <div className="form-grid">
                        {paymentSettings.cpf && (
                            <div className="form-group">
                                <label>CPF</label>
                                <input type="text" value={paymentSettings.cpf} disabled className="form-input" />
                            </div>
                        )}
                        {paymentSettings.cnpj && (
                            <div className="form-group">
                                <label>CNPJ</label>
                                <input type="text" value={paymentSettings.cnpj} disabled className="form-input" />
                            </div>
                        )}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="pix_token">Chave PIX (Copia e Cola)</label>
                            <input
                                type="text"
                                id="pix_token"
                                value={paymentSettings.pix_token || ''}
                                onChange={(e) => setPaymentSettings(prev => ({ ...prev, pix_token: e.target.value }))}
                                placeholder="Insira sua chave PIX aqui"
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div className="profile-actions" style={{ justifyContent: 'flex-start', paddingTop: '24px', borderTop: 'none', paddingLeft: 0, paddingBottom: 0 }}>
                        <button className="btn btn-primary" onClick={handleSavePayment}>
                            <FiSave /> Salvar Pagamento
                        </button>
                    </div>
                    {message && <p className={message.startsWith('Erro') ? 'error-message' : 'success-message'} style={{marginTop: '15px', textAlign: 'center'}}>{message}</p>}
                </div>
            )}

            {/* Seção de Tema - Visível para todos */}
            <div className="settings-card">
                <h2>Aparência do Sistema</h2>
                <p className="description">Escolha um tema que te agrade mais.</p>
                <div className="theme-selector">
                    <div className={`theme-option ${activeTheme === 'light' ? 'active' : ''}`} onClick={() => handleThemeChange('light')}>
                        <FiSun size={24} />
                        <div className="theme-color-swatch"><span style={{ backgroundColor: '#8B5CF6' }}></span><span style={{ backgroundColor: '#F9FAFB' }}></span></div>
                        <span className="theme-name">Claro</span>
                    </div>
                    <div className={`theme-option ${activeTheme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeChange('dark')}>
                        <FiMoon size={24} />
                        <div className="theme-color-swatch"><span style={{ backgroundColor: '#A78BFA' }}></span><span style={{ backgroundColor: '#1F2937' }}></span></div>
                        <span className="theme-name">Escuro</span>
                    </div>
                    <div className={`theme-option ${activeTheme === 'colorful' ? 'active' : ''}`} onClick={() => handleThemeChange('colorful')}>
                        <FiZap size={24} />
                        <div className="theme-color-swatch"><span style={{ backgroundColor: '#EF4444' }}></span><span style={{ backgroundColor: '#3B82F6' }}></span></div>
                        <span className="theme-name">Colorido</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;