// src/CookieConsentBanner.tsx

import React from 'react';
import '../src/styles/CookieConsentBanner.css';

interface CookieConsentBannerProps {
  onAccept: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept }) => {
  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <p>
          Nós utilizamos cookies para otimizar e aprimorar sua experiência de navegação em nosso site. Ao continuar, você concorda com a nossa{' '}
          <a href="/politicas/privacidade" target="_blank" rel="noopener noreferrer">
            Política de Privacidade
          </a>
          {' '}e com a nossa{' '}
          <a href="/politicas/cookies" target="_blank" rel="noopener noreferrer">
            Política de Cookies
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