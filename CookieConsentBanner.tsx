// src/CookieConsentBanner.tsx

import React from 'react';
import './styles/CookieConsentBanner.css'; // Criaremos este CSS no próximo passo

interface CookieConsentBannerProps {
  onAccept: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept }) => {
  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <p>
          Nós utilizamos cookies para otimizar e aprimorar sua experiência de navegação em nosso site. Ao continuar, você concorda com a nossa{' '}
          <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">
            Política de Privacidade
          </a>.
        </p>
        <button onClick={onAccept} className="cookie-consent-btn">
          Aceitar
        </button>
      </div>
    </div>
  );
};

export default CookieConsentBanner;