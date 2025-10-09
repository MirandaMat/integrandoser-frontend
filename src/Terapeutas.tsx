// /src/Terapeutas.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/App.css';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

import { IoSearchOutline, IoClose } from "react-icons/io5";

// Interface para a tipagem dos dados dos profissionais
interface Therapist {
  id: number;
  name: string;
  profissao: string;
  specialty: string;
  experience: string;
  approaches: string[];
  description: string;
  imgUrl: string;
}

// Função de normalização (sem alterações)
function normalizeSpecialty(specialtyRaw: string): string {
  if (!specialtyRaw) return "Não especificada";
  const normalized = specialtyRaw.trim().toLowerCase();
  if (/junguian[ao]/.test(normalized) || /psicologia anal[ií]tica/.test(normalized)) return "Psicoterapeuta Junguiano";
  if (/psicanalis[ea]/.test(normalized) || /psicoanalista/.test(normalized)) return "Psicanalista";
  if (/psic[oó]log[oa]/.test(normalized)) return "Psicóloga";
  if (/psicoterapeuta/.test(normalized)) return "Psicoterapeuta";
  if (/nutricion(ist[ao])/i.test(normalized)) return "Nutricionista";
  if (/enfermeir[ao]/i.test(normalized) || /ayurveda/.test(normalized)) return "Terapias Integrativas";
  return specialtyRaw;
}

export default function TerapeutasPage() {
  // Estados para dados da API, loading e erro
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para a UI (filtros e modal)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todas");
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // useEffect para buscar os dados dos profissionais públicos da API
  useEffect(() => {
    const fetchPublicTherapists = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/api/users/professionals/public`);
        
        // Mapeia os dados do backend para o formato esperado pelo frontend
        const mappedData = response.data.map((prof: any) => ({
          id: prof.id,
          name: prof.nome,
          profissao: prof.profissao,
          specialty: prof.especialidade,
          experience: prof.experiencia,
          approaches: typeof prof.abordagem === 'string' ? prof.abordagem.split(',').map(item => item.trim()) : [],
          imgUrl: `${apiUrl}/${prof.imagem_url}`,
          // 'description' não vem da API pública, então usamos um fallback ou buscamos no perfil completo se necessário
          description: prof.description || 'Profissional qualificado com vasta experiência em sua área de atuação. Entre em contato para saber mais sobre sua jornada e abordagens terapêuticas.'
        }));

        setTherapists(mappedData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar profissionais:", err);
        setError("Não foi possível carregar os profissionais no momento. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTherapists();
  }, []);

  // Lógica de filtragem que agora opera sobre o estado 'therapists'
  const allSpecialties = ["Todas", ...new Set(
    therapists.map(t => normalizeSpecialty(t.specialty))
  )].sort((a, b) => a.localeCompare(b));

  const filteredTherapists = therapists
    .filter(therapist => {
      if (selectedSpecialty === "Todas") return true;
      return normalizeSpecialty(therapist.specialty) === selectedSpecialty;
    })
    .filter(therapist => {
      const term = searchTerm.toLowerCase();
      return (
        therapist.name.toLowerCase().includes(term) ||
        therapist.specialty.toLowerCase().includes(term) ||
        therapist.approaches.some(approach => approach.toLowerCase().includes(term))
      );
    });
    
  // Funções de manipulação da UI (sem alterações)
  const clearSearch = () => setSearchTerm('');
  const openModal = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTherapist(null);
    document.body.style.overflow = 'auto';
  };
  const handleContactClick = () => {
    closeModal();
    navigate('/triagem');
  };

  return (
    <div className="app-container">
      {/* Modal de Perfil Completo */}
      {isModalOpen && selectedTherapist && (
        <div className="therapist-modal-overlay" onClick={closeModal}>
          <div className="therapist-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>
              <IoClose size={24} />
            </button>
            <div className="modal-header">
              <div className="modal-image">
                <img src={selectedTherapist.imgUrl} alt={selectedTherapist.name} />
              </div>
              <div className="modal-header-content">
                <h2>{selectedTherapist.name}</h2>
                <p className="modal-specialty">{selectedTherapist.profissao}</p>
                <p className="modal-experience">{selectedTherapist.specialty}</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h3>Sobre</h3>
                <p>{selectedTherapist.experience}</p>
              </div>
              <div className="modal-section">
                <h3>Abordagens</h3>
                <div className="modal-approaches">
                  {selectedTherapist.approaches.map((approach, index) => (
                    <span key={index} className="modal-approach-tag">{approach}</span>
                  ))}
                </div>
              </div>
              <button className="modal-contact-btn" onClick={handleContactClick}>
                Agendar Consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção Hero */}
      <section className="hero-section terap-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Profissionais Credenciados</h1>
          <p className="hero-subtitle">Profissionais qualificados para te acompanhar em sua jornada de autoconhecimento</p>
        </div>
      </section>

      {/* Seção Principal de Terapeutas com Filtros */}
      <section className="section-padding">
        <div className="terapeutas-header">
          <h2 className="terapeutas-section-title">Encontre um profissional</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por nome ou abordagem..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm ? (
              <button className="search-clear-btn" onClick={clearSearch}>
                <IoClose size={18} />
              </button>
            ) : (
              <IoSearchOutline className="search-icon" size={20} />
            )}
          </div>
          <div className="specialty-filter-menu">
            {allSpecialties.map(specialty => (
              <button
                key={specialty}
                className={`specialty-filter-btn ${selectedSpecialty === specialty ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty(specialty)}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Terapeutas com tratamento de loading e erro */}
        {loading ? (
          <p className="loading-message">Carregando profissionais...</p>
        ) : error ? (
          <p className="no-results-message">{error}</p>
        ) : (
          <div className="portfolio-grid">
            {filteredTherapists.length > 0 ? (
              filteredTherapists.map((therapist) => (
                <div key={therapist.id} className="portfolio-item">
                  <div className="portfolio-image-background"></div>
                  <div className="portfolio-image">
                    <img src={therapist.imgUrl} alt={therapist.name} onError={(e) => { e.currentTarget.src = '/assets/default-placeholder.png'; }}/>
                  </div>
                  <div className="portfolio-content">
                    <h3>{therapist.name}</h3>
                    <p className="specialty">{therapist.profissao}</p>
                    <p className="experience">{therapist.specialty}</p>
                    <div className="approaches">
                      {therapist.approaches.map((approach, index) => (
                        <span key={index} className="approach-tag">{approach}</span>
                      ))}
                    </div>
                    <button className="portfolio-btn" onClick={() => openModal(therapist)}>
                      Ver Perfil Completo
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results-message">Nenhum profissional encontrado com os critérios selecionados.</p>
            )}
          </div>
        )}
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
              onClick={() => navigate('/triagem')}
            >
              Fale com Nossa Equipe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}