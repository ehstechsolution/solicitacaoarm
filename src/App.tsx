import { useState, useEffect } from 'react';
import Header from './components/Header';
import EtapaContratante from './components/EtapaContratante';
import EtapaEvento from './components/EtapaEvento';
import EtapaPacotes from './components/EtapaPacotes';
import EtapaResumo from './components/EtapaResumo';
import SucessoModal from './components/SucessoModal';
import AgendaIndisponivelModal from './components/AgendaIndisponivelModal';
import VisualizacaoProposta from './components/VisualizacaoProposta';
import { OrcamentoFormData } from './types';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

const INITIAL_FORM_STATE: OrcamentoFormData = {
  tipoCliente: 'Lead frio',
  documentoTipo: 'PF',
  nomeCompleto: '',
  cpf: '',
  cep: '',
  logradouro: '',
  numeroAddress: '',
  bairro: '',
  cidade: '',
  estado: '',
  complemento: '',
  telefone: '',
  email: '',
  fotoCliente: 'https://images.vexels.com/media/users/3/132335/isolated/preview/4af43ce1082231cba5e5aa60fbb03f2f-icones-de-circulo-de-staffs.png',
  dataEvento: '',
  horarioInicio: '',
  localEvento: '',
  cepLocal: '',
  tipoEvento: 'Casamento',
  logradouroLocal: '',
  numeroLocal: '',
  bairroLocal: '',
  cidadeLocal: '',
  estadoLocal: '',
  complementoLocal: '',
  cidadeUfLocal: '',
  pacoteId: '',
  pacoteNome: '',
  pacotePreco: 0,
  subtotal: 0,
  taxaDeslocamento: 0,
  valorTotal: 0,
  aceiteEnergia: false,
  aceitePalco: false,
  aceiteImagem: false,
};

export default function App() {
  // Check if we are in proposal viewing mode (hidden route matcher)
  const matchProposta = window.location.pathname.match(/^\/proposta\/([a-zA-Z0-9_\-]+)\/?$/);
  const proposalId = matchProposta ? matchProposta[1] : null;

  if (proposalId) {
    return <VisualizacaoProposta propostaId={proposalId} />;
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OrcamentoFormData>(INITIAL_FORM_STATE);
  
  // Theme state
  const [darkMode, setDarkMode] = useState(false);

  // Validation trackers for each step
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);
  const [isStep4Valid, setIsStep4Valid] = useState(false);

  // Firestore submission status
  const [submitting, setSubmitting] = useState(false);
  const [checkingAgenda, setCheckingAgenda] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  // Propagate dark mode changes to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#f4f4f5'; // Light slate/zinc-100
      document.body.style.color = '#09090b'; // Zinc-950
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const updateFields = (fields: Partial<OrcamentoFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const scrollToTop = () => {
    const mainEl = document.getElementById('main-scroll-container');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      // Step 2 validation requires external check
      setCheckingAgenda(true);
      try {
        const response = await fetch("https://webhook.ehstech.com.br/webhook/arm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const result = await response.json();
        
        if (result.agenda_disponivel === true) {
          setCurrentStep((prev) => prev + 1);
          setTimeout(scrollToTop, 50);
        } else {
          setShowAgendaModal(true);
        }
      } catch (error) {
        console.error("Erro na verificação de agenda:", error);
        // Fallback: advance anyway
        setCurrentStep((prev) => prev + 1);
        setTimeout(scrollToTop, 50);
      } finally {
        setCheckingAgenda(false);
      }
    } else if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      setTimeout(scrollToTop, 50);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setTimeout(scrollToTop, 50);
    }
  };

  // Triggers the write back to the Firestore DB on final click [ SOLICITAR ORÇAMENTO ]
  const handleSubmit = async () => {
    if (!isStep4Valid) return;

    setSubmitting(true);
    try {
      const orcamentosCollection = collection(db, 'orcamentos');
      
      const dataEventoStamp = formData.dataEvento ? new Date(formData.dataEvento + 'T12:00:00') : null;

      const orcamentoData = {
        cliente: {
          nomeCompleto: formData.nomeCompleto,
          cpf: formData.cpf,
          cep: formData.cep,
          logradouro: formData.logradouro,
          numeroAddress: formData.numeroAddress,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          complemento: formData.complemento,
          telefone: formData.telefone,
          email: formData.email,
        },
        evento: {
          tipo_evento: formData.tipoEvento,
          data_evento: dataEventoStamp,
          horario_inicio: formData.horarioInicio,
          local_evento_nome: formData.localEvento,
          cep_evento: formData.cepLocal.replace(/\D/g, ''),
          endereco_evento: {
            rua: formData.logradouroLocal,
            numero: formData.numeroLocal,
            complemento: formData.complementoLocal,
            bairro: formData.bairroLocal,
            cidade: formData.cidadeLocal,
            uf: formData.estadoLocal,
            taxa_deslocamento: formData.taxaDeslocamento || 0
          }
        },
        pacote: {
          pacoteId: formData.pacoteId,
          pacoteNome: formData.pacoteNome,
          pacotePreco: formData.pacotePreco,
          subtotal: formData.subtotal,
          taxaDeslocamento: formData.taxaDeslocamento,
          valorTotal: formData.valorTotal,
        },
        // Legacy flat fields included for compatibility
        dataEvento: formData.dataEvento,
        horarioInicio: formData.horarioInicio,
        localEvento: formData.localEvento,
        status: 'proposta_solicitada',
        createdAt: serverTimestamp(),
      };
      
      const orcamentoDocRef = await addDoc(orcamentosCollection, orcamentoData);

      await fetch("https://webhook.ehstech.com.br/webhook/arm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, ...orcamentoData })
      });

      setCreatedDocId(orcamentoDocRef.id);
    } catch (error) {
      console.error('Falha ao registrar orçamento no Firestore:', error);
      handleFirestoreError(error, OperationType.CREATE, 'orcamentos');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setCurrentStep(1);
    setIsStep1Valid(false);
    setIsStep2Valid(false);
    setIsStep3Valid(false);
    setIsStep4Valid(false);
    setCreatedDocId(null);
  };

  // Determine current step validation before letting user move forward
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      default: return false;
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-300 p-0 md:p-6 ${
      darkMode ? 'bg-zinc-950' : 'bg-zinc-100'
    }`}>
      <div
        className={`w-full max-w-md h-screen md:h-[820px] flex flex-col relative transition-all duration-300 md:rounded-[36px] md:border-8 md:shadow-2xl overflow-hidden ${
          darkMode 
            ? 'dark bg-black text-white border-zinc-800 md:shadow-black/70' 
            : 'bg-zinc-50 text-zinc-900 border-zinc-200 md:border-zinc-300 md:shadow-zinc-300/40'
        }`}
        id="root-container"
      >
        {/* Visual background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-electric-lime/5 dark:bg-electric-lime/5 blur-3xl pointer-events-none"></div>
        
        {/* App Header & Mode selection */}
        <Header darkMode={darkMode} toggleTheme={toggleTheme} />

        {/* Stepper Progress Segment Bar (Sleek High-End Immersive styling) */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex gap-1.5 h-[6px] w-full mb-3">
            {[1, 2, 3, 4].map((step) => {
              const isActive = currentStep === step;
              const isCompleted = currentStep > step;
              const isAllowed = step === 1 ||
                (step === 2 && isStep1Valid) ||
                (step === 3 && isStep1Valid && isStep2Valid) ||
                (step === 4 && isStep1Valid && isStep2Valid && isStep3Valid);

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (isAllowed) {
                      setCurrentStep(step);
                      setTimeout(scrollToTop, 50);
                    }
                  }}
                  disabled={!isAllowed}
                  className={`flex-1 h-full rounded-[2px] transition-all duration-300 outline-none cursor-pointer ${
                    isActive
                      ? 'bg-electric-lime shadow-[0_0_10px_rgba(204,255,0,0.6)]'
                      : isCompleted
                      ? 'bg-electric-lime/40'
                      : darkMode 
                        ? 'bg-zinc-800' 
                        : 'bg-zinc-200'
                  }`}
                  id={`stepper-btn-${step}`}
                  title={`Etapa ${step}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className={`uppercase tracking-wider font-bold text-[10px] ${
              darkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              Etapa {currentStep} de 4 • <span className={`font-black ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {currentStep === 1 && 'Contrato'}
                {currentStep === 2 && 'Evento'}
                {currentStep === 3 && 'Experiência'}
                {currentStep === 4 && 'Resumo'}
              </span>
            </span>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
              isCurrentStepValid() 
                ? 'text-electric-lime' 
                : darkMode 
                  ? 'text-zinc-600' 
                  : 'text-zinc-400'
            }`}>
              {isCurrentStepValid() ? 'Pronto' : 'Pendente'}
            </span>
          </div>
        </div>

        {/* Main content body panel (Scrollable inside the frame) */}
        <main 
          className="flex-1 px-6 pt-2 pb-24 relative overflow-y-auto"
          id="main-scroll-container"
        >
          <div className="rounded-2xl">
            {currentStep === 1 && (
              <EtapaContratante
                formData={formData}
                updateFields={updateFields}
                onValidationChange={setIsStep1Valid}
              />
            )}

            {currentStep === 2 && (
              <EtapaEvento
                formData={formData}
                updateFields={updateFields}
                onValidationChange={setIsStep2Valid}
              />
            )}

            {currentStep === 3 && (
              <EtapaPacotes
                formData={formData}
                updateFields={updateFields}
                onValidationChange={setIsStep3Valid}
              />
            )}

            {currentStep === 4 && (
              <EtapaResumo
                formData={formData}
                updateFields={updateFields}
                onValidationChange={setIsStep4Valid}
              />
            )}
          </div>
        </main>

        {/* Sticky Bottom Device-Anchored Navigation Bar */}
        <div className={`absolute bottom-0 left-0 right-0 p-5 pb-6 flex items-center gap-3 z-40 transition-colors duration-300 before:absolute before:inset-0 before:pointer-events-none before:z-[-1] before:bg-gradient-to-t ${
          darkMode 
            ? 'bg-black/90 dark:bg-black/90 border-t border-white/[0.05] before:from-black before:to-transparent' 
            : 'bg-zinc-50/90 border-t border-zinc-200 before:from-zinc-50 before:to-transparent'
        }`}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className={`flex-1 py-3.5 font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border ${
                darkMode 
                  ? 'bg-zinc-900/60 hover:bg-zinc-900 border-white/[0.05] text-zinc-300' 
                  : 'bg-zinc-250/60 hover:bg-zinc-200 border-zinc-200 text-zinc-800'
              }`}
              id="btn-voltar"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isCurrentStepValid() || checkingAgenda}
              className="flex-[2] py-3.5 bg-electric-lime hover:bg-lime-400 disabled:opacity-40 disabled:bg-zinc-800/20 disabled:text-zinc-500 border border-transparent text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-electric-lime/20"
              id="btn-proximo"
            >
              {checkingAgenda ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando disponibilidade da agenda...
                </>
              ) : (
                <>
                  Avançar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isStep4Valid || submitting}
              className="flex-[2] py-3.5 bg-electric-lime hover:bg-lime-400 disabled:opacity-40 disabled:bg-zinc-800/20 disabled:text-zinc-500 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-electric-lime/20"
              id="btn-finalizar"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Reservando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Solicitar orçamento
                </>
              )}
            </button>
          )}
        </div>

        {/* Success Modal */}
        {createdDocId && (
          <SucessoModal
            formData={formData}
            docId={createdDocId}
            onRestart={handleReset}
          />
        )}

        <AgendaIndisponivelModal
          isOpen={showAgendaModal}
          onClose={() => setShowAgendaModal(false)}
          onEscolherOutraData={() => setShowAgendaModal(false)}
        />
      </div>
    </div>
  );
}
