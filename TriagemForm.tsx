// src/TriagemForm.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './styles/TriagemForm.css';
import { FaUser, FaBuilding, FaUserMd } from 'react-icons/fa';

// --- Componente do Formulário de Paciente ---
const PacienteForm = ({ onSubmit, onBack, loading }) => {
    const [formData, setFormData] = useState({
        nome_completo: '', email: '', genero: '', telefone: '', endereco: '', cidade: '',
        terapia_buscada: [], modalidade: 'Online', profissao: '', renda_familiar: '',
        preferencia_genero_profissional: 'Indiferente', feedback_questionario: '', concorda_termos: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleMultiSelectChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const currentSelection = prev.terapia_buscada;
            if (checked) {
                return { ...prev, terapia_buscada: [...currentSelection, value] };
            } else {
                return { ...prev, terapia_buscada: currentSelection.filter(item => item !== value) };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.concorda_termos) {
            alert('Você precisa concordar com os termos para continuar.');
            return;
        }
        onSubmit(formData, 'paciente');
    };

    const terapias = ["Psicoterapia", "Psiquiatria", "Terapia Reiki", "Constelação Familiar", "Rakiram", "Nutricionista", "Astrologia", "Supervisão Clínica", "Terapia Ayurveda", "Outro"];

    return (
        <form onSubmit={handleSubmit} className="triagem-form">
            <div className="presentation-text">
                <h3>Terapia Para Todos é um Projeto Social</h3>
                <p>Oferece psicoterapia e outros serviços terapêuticos por custo social. Preencha este formulário para solicitar atendimentos pelo Projeto e aguarde nosso retorno.</p>
                <p><strong>ATENÇÃO PARA AS SEGUINTES INFORMAÇÕES:</strong></p>
                <ul>
                    <li>A frequência das sessões de atendimento é, inicialmente, semanal.</li>
                    <li>Os atendimentos podem ser realizados nas modalidades Online e Presencial (consultar disponibilidade para sua região).</li>
                    <li>A duração de cada sessão é de aproximadamente 50 minutos.</li>
                    <li>Os valores serão acordados conforme profissional escolhido e viabilidade financeira.</li>
                    <li>No caso de atendimento ONLINE, o pagamento deve ser efetuado, de forma antecipada, no valor total das sessões realizadas por mês.</li>
                    <li>O cancelamento de 3 sessões sem aviso prévio configura desligamento do projeto e não isenta a obrigatoriedade do pagamento destas sessões.</li>
                    <li>O pedido de cancelamento da sessão deve ser realizado com antecedência mínima de 72 horas.</li>
                </ul>
            </div>
            <div className="form-group"><label>Nome Completo</label><input type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required /></div>
            <div className="form-group"><label>E-mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
            <div className="form-group"><label>Gênero</label><select name="genero" value={formData.genero} onChange={handleChange}><option value="">Selecione</option><option>Mulher</option><option>Homem</option><option>Não-Binare</option><option>Não quero declarar</option></select></div>
            <div className="form-group"><label>Número de telefone</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} /></div>
            <div className="form-group"><label>Endereço residencial</label><input type="text" name="endereco" value={formData.endereco} onChange={handleChange} /></div>
            <div className="form-group"><label>Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} /></div>
            <div className="form-group"><label>Qual terapia se busca? (marque quantas desejar)</label><div className="checkbox-group-grid">{terapias.map(t => <div key={t} className="checkbox-item"><input type="checkbox" id={`terapia-${t}`} value={t} onChange={handleMultiSelectChange} /><label htmlFor={`terapia-${t}`}>{t}</label></div>)}</div></div>
            <div className="form-group"><label>Qual modalidade?</label><select name="modalidade" value={formData.modalidade} onChange={handleChange}><option>Online</option><option>Presencial</option></select></div>
            <div className="form-group"><label>Qual a sua Profissão?</label><input type="text" name="profissao" value={formData.profissao} onChange={handleChange} /></div>
            <div className="form-group"><label>Qual a sua renda familiar?</label><select name="renda_familiar" value={formData.renda_familiar} onChange={handleChange}><option value="">Selecione</option><option>Menos de R$ 1.000,00</option><option>De R$ 1.000,00 a R$ 2.000,00</option><option>De R$ 2.000,00 a R$ 5.000,00</option><option>Acima de R$ 5.000,00</option></select></div>
            <div className="form-group"><label>Você tem preferência de ser atendido por profissional de qual gênero?</label><select name="preferencia_genero_profissional" value={formData.preferencia_genero_profissional} onChange={handleChange}><option>Indiferente</option><option>Homem</option><option>Mulher</option></select></div>
            <div className="form-group"><label>Como foi responder este questionário? Ficou alguma dúvida? Deseja deixar alguma sugestão para que possamos continuar melhorando?</label><textarea name="feedback_questionario" value={formData.feedback_questionario} onChange={handleChange}></textarea></div>
            <div className="form-group checkbox-group"><input type="checkbox" id="termos" name="concorda_termos" checked={formData.concorda_termos} onChange={handleChange} required /><label htmlFor="termos">Declaro que estou ciente e concordo que, devido a natureza de projeto social e clínica escola do Projeto Terapia Para Todos, poderei ser atendido por profissionais formados ou profissionais em formação.</label></div>
            <div className="form-actions"><button type="button" className="btn-back" onClick={onBack}>Voltar</button><button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Inscrição'}</button></div>
        </form>
    );
};

// --- Componente do Formulário de Empresa ---
const EmpresaForm = ({ onSubmit, onBack, loading }) => {
    const [formData, setFormData] = useState({
        nome_empresa: '', email: '', cnpj: '', num_colaboradores: '', nome_responsavel: '', cargo_responsavel: '', telefone: '',
        caracterizacao_demanda: '', tipo_atendimento_desejado: [], publico_alvo: [], frequencia_desejada: 'Único/pontual', expectativas: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMultiSelectChange = (e, field) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const currentSelection = prev[field];
            if (checked) {
                return { ...prev, [field]: [...currentSelection, value] };
            } else {
                return { ...prev, [field]: currentSelection.filter(item => item !== value) };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, 'empresa');
    };
    
    const tiposAtendimento = ["Atendimento Individual aos colaboradores", "Grupos terapêuticos ou rodas de conversas", "Atendimento de crise/acolhimento pontual", "Acompanhamento psicológico/psiquiátrico contínuo", "Outro"];
    const publicosAlvo = ["Todos os colaboradores", "Lideranças e Gestores", "Equipes específicas/setores críticos", "Colaboradores afastados ou readaptados", "Outro"];

    return (
        <form onSubmit={handleSubmit} className="triagem-form">
            <div className="presentation-text">
                <h3>Proposta para Empresas</h3>
                <p>Para que possamos compreender as necessidades da sua empresa e desenvolver um atendimento personalizado alinhado à realidade do seu negócio, solicitamos que preencha o formulário abaixo com atenção. Cuidar da saúde emocional dos colaboradores não é apenas um gesto de responsabilidade social, mas uma prática reconhecida pela nova NR-1.</p>
            </div>
            <div className="form-group"><label>Nome da Empresa</label><input type="text" name="nome_empresa" value={formData.nome_empresa} onChange={handleChange} required /></div>
            <div className="form-group"><label>E-mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
            <div className="form-group"><label>CNPJ</label><input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} /></div>
            <div className="form-group"><label>Número de colaboradores</label><input type="text" name="num_colaboradores" value={formData.num_colaboradores} onChange={handleChange} /></div>
            <div className="form-group"><label>Nome do Responsável</label><input type="text" name="nome_responsavel" value={formData.nome_responsavel} onChange={handleChange} /></div>
            <div className="form-group"><label>Cargo do Responsável</label><input type="text" name="cargo_responsavel" value={formData.cargo_responsavel} onChange={handleChange} /></div>
            <div className="form-group"><label>Número de telefone</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} /></div>
            <div className="form-group"><label>Caracterização da Demanda</label><textarea name="caracterizacao_demanda" placeholder="Descreva brevemente a motivação para buscar os serviços..." value={formData.caracterizacao_demanda} onChange={handleChange}></textarea></div>
            <div className="form-group"><label>Tipo de atendimento desejado (marque quantas opções desejar)</label><div className="checkbox-group-grid">{tiposAtendimento.map(t => <div key={t} className="checkbox-item"><input type="checkbox" id={`tipo-${t}`} value={t} onChange={e => handleMultiSelectChange(e, 'tipo_atendimento_desejado')} /><label htmlFor={`tipo-${t}`}>{t}</label></div>)}</div></div>
            <div className="form-group"><label>Público-Alvo na empresa</label><div className="checkbox-group-grid">{publicosAlvo.map(t => <div key={t} className="checkbox-item"><input type="checkbox" id={`publico-${t}`} value={t} onChange={e => handleMultiSelectChange(e, 'publico_alvo')} /><label htmlFor={`publico-${t}`}>{t}</label></div>)}</div></div>
            <div className="form-group"><label>Frequência e duração prevista</label><select name="frequencia_desejada" value={formData.frequencia_desejada} onChange={handleChange}><option>Único/pontual</option><option>Semanal</option><option>Quinzenal</option><option>Mensal</option><option>Outro</option></select></div>
            <div className="form-group"><label>Expectativas da Empresa</label><textarea name="expectativas" placeholder="Quais são os principais objetivos da empresa com esse serviço?" value={formData.expectativas} onChange={handleChange}></textarea></div>
            <div className="form-actions"><button type="button" className="btn-back" onClick={onBack}>Voltar</button><button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Proposta'}</button></div>
        </form>
    );
};

// --- Componente do Formulário de Profissional ---
const ProfissionalForm = ({ onSubmit, onBack, loading }) => {
    const [formData, setFormData] = useState({
        nome_completo: '', email: '', endereco: '', cidade: '', telefone: '', nivel_profissional: 'Estudante',
        aluno_tavola: false, modalidade: 'Online', especialidade: '', instituicao_formacao: '', faz_supervisao: false,
        palavras_chave_abordagens: '', faz_analise_pessoal: false, duvidas_sugestoes: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'aluno_tavola' || name === 'faz_supervisao' || name === 'faz_analise_pessoal') {
            setFormData(prev => ({ ...prev, [name]: value === 'Sim' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, 'profissional');
    };

    return (
        <form onSubmit={handleSubmit} className="triagem-form">
            <div className="presentation-text">
                <h3>Seja um Profissional Parceiro</h3>
                <p>O IntegrandoSer - Terapia para Todos é um projeto que visa transformar vidas por meio de um atendimento acessível, personalizado e profundamente humanizado. Se você, estudante ou profissional certificado, sente-se chamado a fazer parte, basta preencher esse formulário. Documentos necessários: Certificado/Diploma/Matrícula, Documento com CPF, Declaração de Análise pessoal e de Supervisão.</p>
            </div>
            <div className="form-group"><label>Nome Completo</label><input type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required /></div>
            <div className="form-group"><label>E-mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
            <div className="form-group"><label>Endereço</label><input type="text" name="endereco" value={formData.endereco} onChange={handleChange} /></div>
            <div className="form-group"><label>Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} /></div>
            <div className="form-group"><label>Número de telefone</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} /></div>
            <div className="form-group"><label>Você é:</label><div className="radio-group"><input type="radio" id="estudante" name="nivel_profissional" value="Estudante" checked={formData.nivel_profissional === 'Estudante'} onChange={handleChange}/><label htmlFor="estudante">Estudante</label><input type="radio" id="certificado" name="nivel_profissional" value="Profissional certificado" checked={formData.nivel_profissional === 'Profissional certificado'} onChange={handleChange}/><label htmlFor="certificado">Profissional certificado</label></div></div>
            <div className="form-group"><label>Você é aluno do Instituto Távola?</label><div className="radio-group"><input type="radio" id="tavola_sim" name="aluno_tavola" value="Sim" checked={formData.aluno_tavola === true} onChange={handleChange}/><label htmlFor="tavola_sim">Sim</label><input type="radio" id="tavola_nao" name="aluno_tavola" value="Não" checked={formData.aluno_tavola === false} onChange={handleChange}/><label htmlFor="tavola_nao">Não</label></div></div>
            <div className="form-group"><label>Sua modalidade é:</label><div className="radio-group"><input type="radio" id="online" name="modalidade" value="Online" checked={formData.modalidade === 'Online'} onChange={handleChange}/><label htmlFor="online">Online</label><input type="radio" id="presencial" name="modalidade" value="Presencial" checked={formData.modalidade === 'Presencial'} onChange={handleChange}/><label htmlFor="presencial">Presencial</label><input type="radio" id="hibrido" name="modalidade" value="Híbrido" checked={formData.modalidade === 'Híbrido'} onChange={handleChange}/><label htmlFor="hibrido">Híbrido</label></div></div>
            <div className="form-group"><label>Qual a especialidade de seu atendimento?</label><textarea name="especialidade" value={formData.especialidade} onChange={handleChange}></textarea></div>
            <div className="form-group"><label>Qual a instituição de sua formação?</label><input type="text" name="instituicao_formacao" value={formData.instituicao_formacao} onChange={handleChange} /></div>
            <div className="form-group"><label>Você faz supervisão?</label><div className="radio-group"><input type="radio" id="supervisao_sim" name="faz_supervisao" value="Sim" checked={formData.faz_supervisao === true} onChange={handleChange}/><label htmlFor="supervisao_sim">Sim</label><input type="radio" id="supervisao_nao" name="faz_supervisao" value="Não" checked={formData.faz_supervisao === false} onChange={handleChange}/><label htmlFor="supervisao_nao">Não</label></div></div>
            <div className="form-group"><label>Palavras chaves sobre sua abordagens (Até 6 abordagens)</label><textarea name="palavras_chave_abordagens" value={formData.palavras_chave_abordagens} onChange={handleChange}></textarea></div>
            <div className="form-group"><label>Você faz análise pessoal?</label><div className="radio-group"><input type="radio" id="analise_sim" name="faz_analise_pessoal" value="Sim" checked={formData.faz_analise_pessoal === true} onChange={handleChange}/><label htmlFor="analise_sim">Sim</label><input type="radio" id="analise_nao" name="faz_analise_pessoal" value="Não" checked={formData.faz_analise_pessoal === false} onChange={handleChange}/><label htmlFor="analise_nao">Não</label></div></div>
            <div className="form-group"><label>Ficou alguma dúvida?</label><textarea name="duvidas_sugestoes" value={formData.duvidas_sugestoes} onChange={handleChange}></textarea></div>
            <div className="form-actions"><button type="button" className="btn-back" onClick={onBack}>Voltar</button><button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Cadastro'}</button></div>
        </form>
    );
};


// --- Componente Principal ---
const TriagemForm = () => {
    const [searchParams] = useSearchParams();
    const [formType, setFormType] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const typeFromUrl = searchParams.get('type');
        if (typeFromUrl && ['paciente', 'empresa', 'profissional'].includes(typeFromUrl)) {
            setFormType(typeFromUrl);
        }
    }, [searchParams]);

    const handleFormSubmit = async (data, type) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`http://localhost:3001/api/triagem/${type}`, data);
            setSuccessMessage(response.data.message);
            setIsSubmitted(true);
        } catch (err) {
            setError('Houve um erro ao enviar o formulário. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    if (isSubmitted) {
        return (
            <div className="triagem-container">
                <div className="triagem-card">
                    <div className="success-message">
                        <h2>Obrigado!</h2>
                        <p>{successMessage}</p>
                        <button className="btn-back" onClick={() => { setIsSubmitted(false); setFormType(null); window.scrollTo(0, 0); }}>Preencher Novo Formulário</button>
                    </div>
                </div>
            </div>
        );
    }

    const renderForm = () => {
        switch (formType) {
            case 'paciente':
                return <PacienteForm onSubmit={handleFormSubmit} onBack={() => setFormType(null)} loading={loading} />;
            case 'empresa':
                return <EmpresaForm onSubmit={handleFormSubmit} onBack={() => setFormType(null)} loading={loading} />;
            case 'profissional':
                return <ProfissionalForm onSubmit={handleFormSubmit} onBack={() => setFormType(null)} loading={loading} />;
            default:
                return (
                    <div className="category-selection">
                        <button className="category-btn" onClick={() => setFormType('paciente')}>
                            <FaUser /> Sou Paciente
                        </button>
                        <button className="category-btn" onClick={() => setFormType('empresa')}>
                            <FaBuilding /> Sou uma Empresa
                        </button>
                        <button className="category-btn" onClick={() => setFormType('profissional')}>
                            <FaUserMd /> Sou Profissional/Estudante
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="triagem-container">
            <div className="triagem-card">
                <div className="triagem-header">
                    <h1>Formulário de Triagem</h1>
                    {!formType && <p>Para começar, selecione a categoria que melhor se encaixa com você.</p>}
                </div>
                {renderForm()}
                {error && <p style={{color: 'red', textAlign: 'center', marginTop: '20px'}}>{error}</p>}
            </div>
        </div>
    );
};

export default TriagemForm;