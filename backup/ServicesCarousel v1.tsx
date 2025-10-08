import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ServicesCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const services = [
    {
      id: 1,
      image: '/assets/servico/terapia-online.jpg',
      title: 'Terapia Online',
      description: 'Sessões de terapia por videochamada, com conveniência e conforto. Ideal para quem busca flexibilidade de horários e atendimento de qualquer lugar.',
      page: 'Terapeutas'
    },
    {
      id: 2,
      image: '/assets/servico/acompanhamento.png',
      title: 'Acompanhamento Terapêutico',
      description: 'Processo contínuo de desenvolvimento pessoal com um terapeuta especializado, ajudando você a navegar pelos desafios da vida com mais clareza.',
      page: 'Terapeutas'
    },
    {
      id: 3,
      image: '/assets/servico/terapia-casal.jpeg',
      title: 'Terapia de Casal',
      description: 'Mediação de conflitos e melhoria na comunicação para relacionamentos mais saudáveis e satisfatórios para ambos os parceiros.',
      page: 'Terapeutas'
    },
    {
      id: 4,
      image: '/assets/servico/avaliacao.jpeg',
      title: 'Avaliação Psicológica',
      description: 'Processo de investigação que utiliza técnicas e instrumentos para compreender aspectos psicológicos específicos do indivíduo.',
      page: 'Terapeutas'
    }
  ];

  const visibleCards = window.innerWidth < 768 ? 1 : window.innerWidth < 992 ? 2 : 3;
  const totalGroups = Math.ceil(services.length / visibleCards);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === totalGroups - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalGroups - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="services-carousel">
      <div className="carousel-container">
        <button className="carousel-btn prev" onClick={prevSlide}>
          <FiChevronLeft />
        </button>
        
        <div 
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`
          }}
        >
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-img-container">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="service-img"
                />
                <div className="service-overlay">
                  <div className="service-content">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="carousel-btn next" onClick={nextSlide}>
          <FiChevronRight />
        </button>
      </div>
      
      <div className="carousel-indicators">
        {Array.from({ length: totalGroups }).map((_, index) => (
          <div
            key={index}
            className={`carousel-indicator ${currentIndex === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ServicesCarousel;