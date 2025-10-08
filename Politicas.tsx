// src/pages/Politicas.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// 1. CORREÇÃO: Importando os valores (constantes)
import { politicaPrivacidadeContent } from './politica_privacidade';
import { politicaCookiesContent } from './politica_cookies';

// 2. CORREÇÃO: Importando os tipos separadamente com "import type"
import type { PolicyContent, CitedText } from './politica_privacidade';

import './CookieConsentBanner.css';

// 3. CORREÇÃO: Ajuste para renderizar o número da citação
const CitedContent: React.FC<{ item: CitedText }> = ({ item }) => (
  <>
    {item.text}
    {item.citations.length > 0 && (
      <span className="citations">
        {item.citations.map(citeNum => ``).join('')}
      </span>
    )}
  </>
);

const Politicas: React.FC = () => {
  const { tipo } = useParams<{ tipo: string }>();
  const [content, setContent] = useState<PolicyContent[] | null>(null);
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    if (tipo === 'privacidade') {
      setContent(politicaPrivacidadeContent);
      setPageTitle('Política de Privacidade');
    } else if (tipo === 'cookies') {
      setContent(politicaCookiesContent as PolicyContent[]);
      setPageTitle('Política de Cookies');
    } else {
      setContent(null);
      setPageTitle('Página Não Encontrada');
    }
  }, [tipo]);

  if (!content) {
    return (
      <div className="politicas-page politicas-not-found">
        <h1>{pageTitle}</h1>
        <p>O conteúdo que você está procurando não foi encontrado.</p>
        <Link to="/" className="btn-primary">Voltar para a Home</Link>
      </div>
    );
  }

  return (
    <div className="politicas-page">
      <header className="politicas-header">
        <h1>{pageTitle}</h1>
      </header>
      <main className="politicas-content">
        {content.map((section, index) => (
          <section key={index} className="politica-section">
            <h2>{section.title}</h2>
            
            {section.content?.map((item, pIndex) => (
              <p key={pIndex}>
                <CitedContent item={item} />
              </p>
            ))}

            {section.subsections?.map((subsection, sIndex) => (
              <div key={sIndex} className="politica-subsection">
                <h3>{subsection.subtitle}</h3>
                {subsection.text && (
                  <p>
                    <CitedContent item={subsection.text} />
                  </p>
                )}
                {subsection.list && (
                  <ul>
                    {subsection.list.map((item, lIndex) => (
                      <li key={lIndex}>
                        <CitedContent item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {section.list && (
              <ul>
                {section.list.map((item, lIndex) => (
                  <li key={lIndex}>
                    <CitedContent item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
    </div>
  );
};

export default Politicas;