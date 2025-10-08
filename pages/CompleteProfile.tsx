// src/pages/CompleteProfile.tsx
import React from 'react';
import ProfileAdm from './adm/ProfileAdm'; 
import '../styles/Admin.css';

const CompleteProfile = () => {
    return (
        // Usamos um layout simples, sem a sidebar, para focar na tarefa
        <div className="complete-profile-layout">
            <div className="complete-profile-card">
                <div className="admin-header" style={{marginBottom: '10px', textAlign: 'center'}}>
                    <img src="/full.png" alt="Logo" style={{width: '200px', marginBottom: '20px'}}/>
                    <h1>Complete Seu Cadastro</h1>
                    <p>
                        Bem-vindo(a)! Para garantir a segurança da sua conta e a precisão das suas informações,
                        por favor, complete seu perfil e defina uma nova senha.
                    </p>
                </div>
                {/* O componente ProfileAdm já contém toda a lógica de formulário e salvamento */}
                <ProfileAdm isFirstLogin={true} />
            </div>
        </div>
    );
};

export default CompleteProfile;