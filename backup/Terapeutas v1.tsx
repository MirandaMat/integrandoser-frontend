import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

import { IoSearchOutline } from "react-icons/io5";

const therapists = [
  {
    id: 1,
    name: "MSc. Alice Silveira",
    specialty: "Psicoterapeuta Junguiana",
    experience: "X anos",
    description: "...",
    imgUrl: "/assets/terapeutas/alice_silveira.png",
    profileUrl: "/terapeuta/fernanda",
    approaches: ["Psicoterapia Junguiana", "Astróloga", "Terapia de Casal e Família"]
  },
  {
    id: 2,
    name: "Camila Lobato",
    specialty: "Analista Junguiana",
    experience: "X anos",
    description: "...",
    imgUrl: "/assets/terapeutas/camila_lobato.png",
    profileUrl: "/terapeuta/carlos",
    approaches: ["Relacionamentos", "Mulheres", "Especialista em Transtornos Alimentares"]
  },
  {
    id: 3,
    name: "MSc. Cecília Cantero",
    specialty: "Psicanalista",
    experience: "X anos",
    description: "Atendimento psicanalítico para adultos e adolescentes, com enfoque em relações familiares.",
    imgUrl: "/assets/terapeutas/cecilia_cantero.png",
    profileUrl: "",
    approaches: ["Família", "Lidar com conflitos pessoais e profissionais", "Psicanalista"]
  },
  {
    id: 4,
    name: "Fernanda Oliveira",
    specialty: "Analista Junguiana",
    experience: "X anos",
    description: "",
    imgUrl: "/assets/terapeutas/fernanda_oliveira.png",
    profileUrl: "",
    approaches: ["Compreensão de emoções e sonhos", "Padrões comportamentais", "Lidar com conflitos pessoais e profissionais"]
  },
  {
    id: 5,
    name: "Juliana Teixeira",
    specialty: "Psicoterapeuta",
    experience: "X anos",
    description: "Atendimento psicanalítico para adultos e adolescentes, com enfoque em relações familiares.",
    imgUrl: "/assets/terapeutas/juliana_teixeira.png",
    profileUrl: "",
    approaches: ["Autoconhecimento", "Lidar com conflitos pessoais e profissionais", "Psicoterapia"]
  },
  {
    id: 6,
    name: "Luis Fernandes",
    specialty: "Psicoanalista",
    experience: "X anos",
    description: "",
    imgUrl: "/assets/terapeutas/luis_fernandes.png",
    profileUrl: "",
    approaches: ["Psicodrama", "Terapia em grupo", "Psicanalise"]
  },
  {
    id: 7,
    name: "Luzia Vieira",
    specialty: "Psicoterapeuta",
    experience: "X anos",
    description: "",
    imgUrl: "/assets/terapeutas/luzia_vieira.png",
    profileUrl: "",
    approaches: ["Psicanalise", "Especialista em Casos limites difíceis", "Dependência emocional e química"]
  },
  {
    id: 8,
    name: "Melissa Danda",
    specialty: "Desconhecido",
    experience: "X anos",
    description: "...",
    imgUrl: "/assets/terapeutas/melissa_danda.png",
    profileUrl: "",
    approaches: ["Desconhecido", "Desconhecido", "Desconhecido"]
  },
  {
    id: 9,
    name: "Suellen Kiefer",
    specialty: "Psicoterapeuta",
    experience: "X anos",
    description: "...",
    imgUrl: "/assets/terapeutas/suellen_kiefer.png",
    profileUrl: "",
    approaches: ["Pesquisadora", "Síndrome de Burnout", "Terapia de orientação analítica junguiana", "Autoconhecimento", "Depressão"]
  },
  {
    id: 10,
    name: "Tatiana Cantarino",
    specialty: "Analista Junguiana",
    experience: "X anos",
    description: "...",
    imgUrl: "/assets/terapeutas/tatiana_cantarino.png",
    profileUrl: "",
    approaches: ["Autoconhecimento", "Comportamento e emoção", "Terapia floral", "Perfumista botânica"]
  },
  {
    id: 11,
    name: "Thaina Mansur",
    specialty: "Psicóloga",
    experience: "X anos",
    description: "...",
    imgUrl: "/assets/terapeutas/thaina_mansur.png",
    profileUrl: "",
    approaches: ["Psicanalitica", "Comportamento e emoção", "Lidar com conflitos e inseguranças"]
  }


];

export default function TerapeutasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredTherapists = therapists.filter(therapist =>
    therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    therapist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    therapist.approaches.some(approach => 
      approach.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="app-container">
      {/* Seção Hero para Terapeutas */}
      <section className="hero-section terap-hero">
        
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Conheça Nossa Equipe de Terapeutas</h1>
          <p className="hero-subtitle">Profissionais qualificados para te acompanhar em sua jornada de autoconhecimento</p>
        </div>
      </section>

      {/* Seção Principal de Terapeutas */}
      <section className="section-padding">
        <div className="terapeutas-header">
          <h2 className="terapeutas-section-title">Encontre um profissional</h2>
          
          {/* Barra de Busca */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou abordagem..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="search-icon" viewBox="0 0 24 24">
              <IoSearchOutline size={25}/>
            </svg>
          </div>
        </div>

        {/* Grid de Terapeutas */}
        <div className="portfolio-grid">
          {filteredTherapists.map((therapist) => (
            <div key={therapist.id} className="portfolio-item">
              <div className="portfolio-image">
                <img src={therapist.imgUrl} alt={therapist.name} />
              </div>
              <div className="portfolio-content">
                <h3>{therapist.name}</h3>
                <p className="specialty">{therapist.specialty}</p>
                <p className="experience">{therapist.experience} de experiência</p>
                <div className="approaches">
                  {therapist.approaches.map((approach, index) => (
                    <span key={index} className="approach-tag">{approach}</span>
                  ))}
                </div>
                <button 
                  className="portfolio-btn"
                  onClick={() => navigate(therapist.profileUrl)}
                >
                  Ver Perfil Completo
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seção de CTA */}
      <section className="section-padding light-bg">
        <div className="terapeutas-cta-container">
          <div className="terapeutas-cta-bg"></div>
          <div className="terapeutas-cta-content">
            <h2 className="terapeutas-cta-title">Não encontrou o terapeuta ideal?</h2>
            <p className="terapeutas-cta-text">
              Nossa equipe pode ajudar a encontrar o profissional perfeito para suas necessidades específicas.
            </p>
            <button 
              className="terapeutas-cta-btn"
              onClick={() => navigate('/contato')}
            >
              Fale com Nossa Equipe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}