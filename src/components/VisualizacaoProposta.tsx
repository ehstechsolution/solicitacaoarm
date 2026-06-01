import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CATALOGO_PACOTES } from '../data';
import { formatCurrency } from '../utils';
import { Pacote } from '../types';
import ModalDetalhesPacote from './ModalDetalhesPacote';
import ModalDetalhesEquipamento from './ModalDetalhesEquipamento';
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Users,
  Wrench,
  ChevronRight,
  Send,
  Info
} from 'lucide-react';

interface ClienteSchema {
  nomeCompleto: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numeroAddress: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  telefone: string;
  email: string;
}

interface EventoSchema {
  tipo_evento: string;
  data_evento: any;
  local_evento: string;
  taxa_deslocamento: number;
}

interface PacoteSchema {
  pacoteId: string;
  pacoteNome: string;
  pacotePreco: number;
  subtotal: number;
  taxaDeslocamento: number;
  valorTotal: number;
}

interface FirestoreOrcamento {
  cliente: ClienteSchema;
  evento: EventoSchema;
  pacote: PacoteSchema;
  dataEvento: string;
  horarioInicio: string;
  localEvento: string;
  status: string;
  createdAt?: any;
}

interface VisualizacaoPropostaProps {
  propostaId: string;
}

// Escopo Rico de Equipe Técnica e Equipamentos mapeado de forma elegante para o Cliente
const ESCOPO_DETALHADO: Record<string, { equipe: string[], equipamentos: string[] }> = {
  compacto: {
    equipe: [
      '1 Técnico de som e montagem técnica credenciado',
      'Suporte operacional ativo da ARM Som/Luz'
    ],
    equipamentos: [
      '2 Caixas acústicas ativas profissionais (com tripés de metal)',
      '4 Refletores Par LED cênicos RGBW ultra-brilhantes',
      '1 Mesa de som digital compacta de alta fidelidade (Bluetooth/USB)',
      'Infraestrutura completa de cabeamento de força e sinal com proteção'
    ]
  },
  premium: {
    equipe: [
      '1 Operador Light Designer e efeitos (Operações via DMX)',
      '1 Técnico sênior de calibração eletroacústica e montagem geral'
    ],
    equipamentos: [
      'Pórtico estrutural robusto em alumínio nobre (Treliça Q15/Q25)',
      '4 Moving Heads Spots robóticos de movimentação computadorizada',
      '1 Máquina de fumaça profissional operada remotamente (alta vazão)',
      'Sistema de som multi-vias com Subwoofer ativo de alta pressão',
      'Cabine de DJ envelopada sob medida com retroiluminação em LED',
      'Controladora/Interface integrada de luzes e mesa analógica balanceada'
    ]
  },
  master_show: {
    equipe: [
      '1 DJ Profissional qualificado para comando do repertório',
      '1 Técnico de vídeo focado na sincronização do Painel de LED',
      '1 Operador de Luz Computadorizada e efeitos especiais do palco',
      '2 Auxiliares operacionais de montagem de grande porte'
    ],
    equipamentos: [
      'Painel de LED de Alta Definição (P3/P2) calibrado para projeções',
      'Sistema acústico Line Array com dispersão homogênea de som',
      'Pista de dança iluminada de alta durabilidade e impacto visual',
      '4 Canhões Sparklers de faíscas frias (sem risco de fogo/calor)',
      'Grid aéreo estrutural completo para distribuição cênica e sonorização'
    ]
  },
  personalizado: {
    equipe: [
      'Equipe de técnicos especialistas dimensionada sob medida do projeto',
      '1 Engenheiro ou Supervisor Geral de Evento presente em loco'
    ],
    equipamentos: [
      'Som linear profissional dimensionado em software de acústica',
      'Iluminação de show/palco de alta potência projetada sob medida',
      'Infraestrutura e cabeamento pesado com no-break para eletrônicos'
    ]
  }
};

interface FirestorePacote {
  titulo: string;
  descricao: string;
  ativo?: boolean;
  preco_custo_base?: number;
  preco_venda?: number;
  equipe_tecnica?: { funcao: string; quantidade: number; custo_diaria?: number }[];
  equipamentos?: { equipamento_id?: string; nome: string; categoria?: string; quantidade: number; preco_aluguel_unitario?: number }[];
}

export default function VisualizacaoProposta({ propostaId }: VisualizacaoPropostaProps) {
  const [orcamento, setOrcamento] = useState<FirestoreOrcamento | null>(null);
  const [pacoteData, setPacoteData] = useState<FirestorePacote | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<'not_found' | 'invalid_status' | 'error' | null>(null);
  const [loadedAsProcessed, setLoadedAsProcessed] = useState(false);
  const [abrirPacoteModal, setAbrirPacoteModal] = useState(false);
  const [equipamentoParaDetalhesId, setEquipamentoParaDetalhesId] = useState<string | null>(null);
  const [isAprovando, setIsAprovando] = useState(false);

  useEffect(() => {
    const fetchOrcamento = async () => {
      setLoading(true);
      setErrorStatus(null);
      try {
        const docRef = doc(db, 'orcamentos', propostaId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as FirestoreOrcamento;
          if (data.status === 'cancelado') {
            setErrorStatus('invalid_status');
          } else {
            setOrcamento(data);
            if (data.status === 'aprovado' || data.status === 'rejeitado') {
              setLoadedAsProcessed(true);
            }
            
            // Busca dinâmica do pacote na coleção 'pacotes'
            const pId = data.pacote?.pacoteId;
            if (pId && pId !== 'personalizado') {
              try {
                const pacRef = doc(db, 'pacotes', pId);
                const pacSnap = await getDoc(pacRef);
                if (pacSnap.exists()) {
                  setPacoteData(pacSnap.data() as FirestorePacote);
                }
              } catch (pacErr) {
                console.error('Erro ao carregar pacote dinâmico:', pacErr);
              }
            }
          }
        } else {
          setErrorStatus('not_found');
        }
      } catch (err) {
        console.error('Erro ao buscar o orçamento no banco:', err);
        setErrorStatus('error');
      } finally {
        setLoading(false);
      }
    };

    if (propostaId) {
      fetchOrcamento();
    }
  }, [propostaId]);

  const formatMaskedCPF = (cpfStr: string) => {
    if (!cpfStr) return '';
    const clean = cpfStr.replace(/\D/g, '');
    if (clean.length === 11) {
      return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
    } else if (clean.length === 14) {
      return `**..***.***\/${clean.slice(8, 12)}-**`;
    }
    return cpfStr;
  };

  const formatDataEvento = (dataRaw: any, fallbackStr?: string): string => {
    if (!dataRaw) {
      return fallbackStr ? fallbackStr.split('-').reverse().join('/') : '';
    }
    try {
      let d: Date;
      if (typeof dataRaw.toDate === 'function') {
        d = dataRaw.toDate();
      } else if (dataRaw instanceof Date) {
        d = dataRaw;
      } else if (typeof dataRaw === 'string') {
        const parts = dataRaw.split('T')[0].split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dataRaw;
      } else if (dataRaw.seconds) {
        d = new Date(dataRaw.seconds * 1000);
      } else {
        d = new Date(dataRaw);
      }
      
      if (isNaN(d.getTime())) {
        return fallbackStr ? fallbackStr.split('-').reverse().join('/') : '';
      }
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return fallbackStr ? fallbackStr.split('-').reverse().join('/') : '';
    }
  };

  const handleAprovar = async () => {
    if (isAprovando || !orcamento) return;
    setIsAprovando(true);

    try {
      // 1. Atualiza no Firestore para "aprovado"
      const docRef = doc(db, 'orcamentos', propostaId);
      await updateDoc(docRef, { status: 'aprovado' });

      // 2. Envia o POST para o Webhook com os dados do orçamento (e o id, origem)
      const payload = {
        id: propostaId,
        origem: "orcamento_aprovado",
        ...orcamento,
        status: 'aprovado'
      };

      try {
        const response = await fetch('https://webhook.ehstech.com.br/webhook/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          console.warn('Webhook respondeu com erro:', response.status, response.statusText);
        } else {
          console.log('Webhook disparado com sucesso!');
        }
      } catch (postErr) {
        console.error('Erro ao enviar POST HTTP para o Webhook:', postErr);
      }

      // 3. Atualiza o estado local do orçamento para refletir a aprovação imediatamente na tela
      setOrcamento(prev => prev ? { ...prev, status: 'aprovado' } : null);

      // 4. Exibe mensagem de feedback bem formatada
      alert("Perfeito! Proposta recebida e aprovada com sucesso.");

    } catch (err) {
      console.error('Erro na aprovação da proposta:', err);
      alert('Ocorreu um erro ao registrar sua aprovação. Por favor, tente novamente ou entre em contato diretamente.');
    } finally {
      setIsAprovando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-[#1A1A1A]">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full border-4 border-[#B1D334]/20 border-t-[#B1D334] animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#F47B20] animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-black text-base text-zinc-950 uppercase tracking-wider">
              Buscando Proposta
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              Autenticando conexão segura...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadedAsProcessed && orcamento) {
    const statusLabel = orcamento.status === 'aprovado' ? 'aprovado' : orcamento.status === 'rejeitado' ? 'rejeitado' : 'processado';

    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 text-[#1A1A1A]">
        <div className="w-full max-w-[480px] bg-white rounded-[26px] shadow-xl p-8 text-center border-t-4 border-[#B1D334] space-y-6">
          <div className="w-14 h-14 bg-emerald-50 text-[#B1D334] rounded-full flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-[#B1D334] stroke-[3]" />
          </div>
          <div className="space-y-3">
            <h3 className="font-sans font-black text-base text-zinc-950 uppercase tracking-wider">
              Orçamento Processado
            </h3>
            <p className="text-xs text-zinc-650 leading-relaxed">
              Este orçamento de som e luz já foi processado e finalizado como <strong className="text-zinc-900 font-extrabold uppercase">{statusLabel === 'aprovado' ? 'Aprovado' : 'Recusado'}</strong>.
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              Em breve alguém da equipe <strong className="text-zinc-900 font-bold">ARM Som e Luz</strong> entrará em contato com você via WhatsApp para alinhar os próximos passos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorStatus || !orcamento) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 text-[#1A1A1A]">
        <div className="w-full max-w-[480px] bg-white rounded-[26px] shadow-xl p-8 text-center border-t-4 border-[#F47B20] space-y-6">
          <div className="w-14 h-14 bg-amber-50 text-[#F47B20] rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-3">
            <h3 className="font-sans font-black text-base text-zinc-950 uppercase tracking-wider">
              Orçamento Não Localizado
            </h3>
            <p className="text-xs text-zinc-650 leading-relaxed">
              Este orçamento não foi localizado na base de dados da <strong className="text-zinc-900 font-extrabold">ARM Som e Luz</strong> ou o link de acesso está incorreto.
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              Por favor, verifique a URL enviada ou entre em contato direto com a <strong className="text-zinc-900 font-bold">ARM</strong> para suporte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tenta encontrar o pacote a partir do catálogo local ou usa padrão
  const rawId = orcamento.pacote.pacoteId || 'personalizado';
  const escopo = ESCOPO_DETALHADO[rawId] || ESCOPO_DETALHADO.personalizado;
  const staticPacote = CATALOGO_PACOTES.find(p => p.pacote_id === rawId);
  const isPersonalizado = rawId === 'personalizado';

  const dynamicDescricao = pacoteData?.descricao || (staticPacote ? staticPacote.descricao : 'Projeto personalizado ajustado às configurações geográficas e estéticas recomendadas para o salão informado.');

  // Estrutura completa de equipamentos para renderização e detalhes individuais
  const equipamentosNativos = pacoteData?.equipamentos && pacoteData.equipamentos.length > 0
    ? pacoteData.equipamentos.map(item => ({
        equipamento_id: item.equipamento_id || '',
        nome: item.nome,
        quantidade: item.quantidade
      }))
    : staticPacote?.equipamentos?.map(item => ({
        equipamento_id: item.equipamento_id,
        nome: item.nome,
        quantidade: item.quantidade
      })) || escopo.equipamentos.map((item) => {
        const matches = item.match(/^(\d+)x?\s+(.*)/);
        if (matches) {
          return {
            equipamento_id: '',
            nome: matches[2],
            quantidade: parseInt(matches[1], 10)
          };
        }
        return {
          equipamento_id: '',
          nome: item,
          quantidade: 1
        };
      });

  // Monta as listas de forma dinâmica baseado no que veio da coleção pacotes no Firestore, ou usa a estática como Fallback
  const equipeLista = pacoteData?.equipe_tecnica && pacoteData.equipe_tecnica.length > 0
    ? pacoteData.equipe_tecnica.map(item => `${item.quantidade}x ${item.funcao}`)
    : escopo.equipe;

  // Prepara o objeto Pacote estruturado para o modal de detalhes
  const pacoteParaDetalhes: Pacote | null = orcamento.pacote ? {
    pacote_id: orcamento.pacote.pacoteId || 'personalizado',
    titulo: orcamento.pacote.pacoteNome,
    descricao: dynamicDescricao,
    preco_venda: orcamento.pacote.pacotePreco,
    preco_custo_base: 0,
    ativo: true,
    criado_em: null,
    equipe_tecnica: pacoteData?.equipe_tecnica || staticPacote?.equipe_tecnica || escopo.equipe.map(item => {
      const matches = item.match(/^(\d+)x?\s+(.*)/);
      if (matches) {
        return {
          funcao: matches[2],
          quantidade: parseInt(matches[1], 10),
          custo_diaria: 0
        };
      }
      return {
        funcao: item,
        quantidade: 1,
        custo_diaria: 0
      };
    }),
    equipamentos: equipamentosNativos.map(eq => ({
      equipamento_id: eq.equipamento_id || '',
      nome: eq.nome,
      categoria: 'Equipamento',
      quantidade: eq.quantidade,
      preco_aluguel_unitario: 0
    }))
  } : null;

  return (
    <>
      <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans flex justify-center items-start py-4 px-3 sm:px-4">
      {/* Container Otimizado para Mobile-First (Max 480px) com Visual Extremamente Limpo */}
      <div className="w-full max-w-[480px] bg-white rounded-[26px] shadow-lg border border-zinc-100 overflow-hidden pb-10 flex flex-col">
        
        {/* 1. CABEÇALHO E LOGO */}
        <header className="p-5 text-center space-y-3.5 bg-gradient-to-b from-zinc-50/50 to-white">
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src="https://res.cloudinary.com/dnatvwcxy/image/upload/v1779424576/logo_arthur_luz_e_som_lbrpth.jpg" 
                alt="ARM Som e Luz Logo" 
                className="w-20 h-20 rounded-full object-cover border-3 border-[#B1D334] shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#F47B20] rounded-full flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-3 h-3" />
              </div>
            </div>
          </div>
          
          <div className="h-0.5 bg-gradient-to-r from-[#B1D334] to-[#F47B20] rounded-full w-24 mx-auto"></div>

          <div className="space-y-0.5">
            <h1 className="font-display font-black text-xl tracking-tight text-zinc-950">
              ARM SOM E LUZ
            </h1>
            <p className="text-[10px] font-black tracking-widest text-[#F47B20] uppercase">
              Proposta Comercial Ativa
            </p>
          </div>
        </header>

        {/* Corpo da página */}
        <div className="px-4 space-y-5">

          {/* 2. SEÇÃO CONCEITO - Compacto e Elegante */}
          <section className="bg-[#B1D334]/5 border-l-3 border-[#B1D334] rounded-r-xl p-3.5 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B1D334] mb-1">
              Conceito
            </h3>
            <p className="text-zinc-800 text-[11px] sm:text-xs leading-relaxed">
              Prezado(a) <strong className="text-zinc-950 font-bold">{orcamento.cliente.nomeCompleto}</strong>, preparamos uma engenharia de palco otimizada especialmente para o seu evento. Projetamos o máximo impacto acústico, riqueza visual e sofisticação estética que sua comemoração exige.
            </p>
          </section>

          {/* 3. SEÇÃO DADOS DO CLIENTE - Limpa e Sem CEP */}
          <section className="space-y-1.5">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <span className="w-1 h-2.5 bg-[#B1D334] rounded-sm"></span>
              Dados do Cliente
            </h2>
            <div className="border border-zinc-100 rounded-xl bg-white p-3.5 space-y-2.5 shadow-sm text-left text-[11px] sm:text-xs">
              <div>
                <span className="text-[9px] text-zinc-400 block font-medium uppercase">Nome Completo</span>
                <span className="font-bold text-zinc-900">{orcamento.cliente.nomeCompleto}</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[9px] text-zinc-400 block font-medium uppercase">CPF / CNPJ</span>
                  <span className="font-semibold text-zinc-750">{formatMaskedCPF(orcamento.cliente.cpf)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block font-medium uppercase">Telefone</span>
                  <span className="font-semibold text-zinc-750">{orcamento.cliente.telefone}</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 block font-medium uppercase">E-mail</span>
                <span className="font-semibold text-zinc-750 break-all">{orcamento.cliente.email}</span>
              </div>
              <div className="pt-2 border-t border-zinc-50">
                <span className="text-[9px] text-zinc-400 block font-medium uppercase">Endereço de Entrega/Montagem</span>
                <span className="text-zinc-600 block leading-relaxed mt-0.5">
                  {orcamento.cliente.logradouro}, {orcamento.cliente.numeroAddress}
                  {orcamento.cliente.complemento && ` — ${orcamento.cliente.complemento}`}
                  <br />
                  {orcamento.cliente.bairro} — {orcamento.cliente.cidade}/{orcamento.cliente.estado}
                </span>
              </div>
            </div>
          </section>

          {/* 4. SEÇÃO DADOS DO EVENTO - Alinhamento Mobile Premium */}
          <section className="space-y-1.5">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <span className="w-1 h-2.5 bg-[#F47B20] rounded-sm"></span>
              Especificações do Evento
            </h2>
            <div className="border border-zinc-100 rounded-xl bg-white p-3.5 space-y-3 shadow-sm text-left text-[11px] sm:text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-[#F47B20]/10 flex items-center justify-center text-[#F47B20] shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase leading-none mb-0.5">Tipo do Evento</span>
                  <span className="font-bold text-zinc-900">{orcamento.evento.tipo_evento || orcamento.dataEvento}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-zinc-50 flex items-center justify-center text-zinc-500 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase leading-none mb-0.5">Data Reservada</span>
                    <span className="font-bold text-zinc-850">
                      {formatDataEvento(orcamento.evento.data_evento, orcamento.dataEvento)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-zinc-50 flex items-center justify-center text-zinc-500 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase leading-none mb-0.5">Início</span>
                    <span className="font-bold text-zinc-850">{orcamento.horarioInicio}h</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2.5 border-t border-zinc-50">
                <div className="w-6 h-6 rounded bg-zinc-50 flex items-center justify-center text-zinc-500 shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase leading-none mb-0.5">Local da Execução</span>
                  <span className="font-semibold text-zinc-850 block leading-normal">
                    {orcamento.evento.local_evento || orcamento.localEvento}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. SEÇÃO PACOTE ESCOLHIDO - Detalhes do seu pacote com Listas de Equipe e Equipamentos */}
          <section className="space-y-1.5">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <span className="w-1 h-2.5 bg-[#B1D334] rounded-sm"></span>
              Detalhes do seu pacote
            </h2>
            
            <div className="border border-zinc-100 rounded-xl bg-white p-4 space-y-4 shadow-sm text-left">
              {/* Nome do Pacote Destacado */}
              <div className="pb-3 border-b border-zinc-50">
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">
                  {orcamento.pacote.pacoteNome}
                </h3>
                <p className="text-[10px] text-[#F47B20] font-bold uppercase mt-0.5">Plano Técnico Ativo</p>
              </div>

              {/* Descrição em fonte menor */}
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans opacity-95">
                {dynamicDescricao}
              </p>

              {/* Botão de explorar fotos e especificações técnicas completas do pacote */}
              {!isPersonalizado && pacoteParaDetalhes && (
                <button
                  type="button"
                  onClick={() => setAbrirPacoteModal(true)}
                  className="w-full text-[10px] flex items-center justify-center gap-1.5 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold uppercase tracking-wider rounded-lg border border-zinc-100 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  id="btn-ver-detalhes-pacote"
                >
                  <Info className="w-3.5 h-3.5 text-[#F47B20]" /> Detalhes do pacote
                </button>
              )}

              {/* Lista 1: Equipe Técnica */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#B1D334] flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-[#B1D334]" />
                  Lista de Equipe Técnica
                </span>
                <ul className="space-y-1 pl-1 text-[11px] text-zinc-700">
                  {equipeLista.map((membro, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 text-[#F47B20] shrink-0 mt-0.5" />
                      <span>{membro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lista 2: Equipamentos Inclusos */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#F47B20] flex items-center gap-1.5 font-sans">
                  <Wrench className="w-3 h-3 text-[#F47B20]" />
                  Lista de Equipamentos (Clique no info para fotos)
                </span>
                <ul className="space-y-1 pl-1 text-[11px] text-zinc-700 font-sans">
                  {equipamentosNativos.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center py-1 hover:bg-zinc-50/50 rounded-lg pr-1 group">
                      <div className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-[#B1D334] shrink-0 mt-0.5" />
                        <span>{item.quantidade}x {item.nome}</span>
                      </div>
                      {item.equipamento_id && (
                        <button
                          type="button"
                          onClick={() => setEquipamentoParaDetalhesId(item.equipamento_id)}
                          className="text-zinc-400 hover:text-[#F47B20] hover:scale-110 p-1 transition-all cursor-pointer"
                          title="Explorar fotos e especificações completas deste item"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card de Valores Comercial Moderno e Profissional */}
              <div className="pt-4 border-t border-zinc-100 space-y-2 text-[11px] sm:text-xs">
                
                {/* Linha 1: Valor Base do Pacote */}
                <div className="flex justify-between items-center text-zinc-500">
                  <span>Valor do pacote</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {isPersonalizado ? 'Proposta Customizada' : formatCurrency(orcamento.pacote.pacotePreco)}
                  </span>
                </div>

                {/* Linha 2: Taxa de Deslocamento (se houver) */}
                {orcamento.pacote.taxaDeslocamento > 0 && (
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Taxa de deslocamento</span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {formatCurrency(orcamento.pacote.taxaDeslocamento)}
                    </span>
                  </div>
                )}

                {/* Divisória interna sutil */}
                <div className="h-px bg-zinc-50 my-1"></div>

                {/* Card do Investimento Totalizador Compactado e Destacado com Laranja */}
                <div className="rounded-xl border border-dashed border-[#F47B20] bg-[#F47B20]/5 px-3 py-2.5 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F47B20]">
                      INVESTIMENTO
                    </span>
                    <p className="text-[8px] text-zinc-400">Total líquido sem juros</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-black text-lg sm:text-xl text-zinc-950 font-mono tracking-tight">
                      {formatCurrency(orcamento.pacote.valorTotal)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* 6. SEÇÃO CONDIÇÕES GERAIS E CONTATO - Mantido conforme o solicitado */}
          <section className="space-y-1.5">
            <div className="border border-zinc-100 rounded-xl bg-white p-4 space-y-3.5 shadow-sm text-left text-[11px] sm:text-xs">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-450 flex items-center gap-1.5 pb-2 border-b border-zinc-50">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B1D334]" />
                Condições de Execução e Pagamento
              </h2>
              
              <div className="space-y-2.5 text-zinc-600 leading-normal text-[10.5px]">
                <div className="flex gap-1.5 items-start">
                  <div className="w-1 h-1 rounded-full bg-[#F47B20] shrink-0 mt-1.5"></div>
                  <p>
                    <strong>Garantia de Reserva:</strong> 30% de sinal faturado mediante assinatura do contrato, essenciais para o bloqueio e blindagem de data da equipe e maquinário.
                  </p>
                </div>
                
                <div className="flex gap-1.5 items-start">
                  <div className="w-1 h-1 rounded-full bg-[#F47B20] shrink-0 mt-1.5"></div>
                  <p>
                    <strong>Quitação de Saldo:</strong> 70% restante quitados integralmente através de Pix ou transferência até 3 dias úteis antes da data prevista de montagem técnica.
                  </p>
                </div>

                <div className="flex gap-1.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B1D334] shrink-0 mt-1.2"></div>
                  <p>
                    <strong>Infraestrutura Requerida:</strong> Instabilidade elétrica danifica equipamentos robóticos. É obrigatório ponto de energia estável de 220v próximo em conformidade total.
                  </p>
                </div>
              </div>

              {/* Botão com aprovação de orçamento - Ajustado para caber em UMA ÚNICA LINHA no celular */}
              <div className="pt-3.5 border-t border-zinc-50 space-y-1.5">
                <button
                  onClick={handleAprovar}
                  disabled={isAprovando}
                  className={`w-full py-3.5 font-extrabold text-[12px] uppercase tracking-wide rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
                    orcamento.status === 'aprovado'
                      ? 'bg-[#B1D334] text-zinc-950 cursor-default shadow-sm'
                      : isAprovando
                      ? 'bg-zinc-400 text-white cursor-not-allowed opacity-85'
                      : 'bg-gradient-to-r from-[#B1D334] to-[#F47B20] hover:brightness-105 text-white cursor-pointer shadow-orange-500/5'
                  }`}
                  id="btn-aprovar-proposta"
                >
                  <Send className="w-3.5 h-3.5" />
                  {orcamento.status === 'aprovado' ? 'PROPOSTA JÁ APROVADA ✓' : isAprovando ? 'Processando...' : 'APROVAR PROPOSTA'}
                </button>
                <p className="text-[8px] text-zinc-400 text-center leading-none">
                  O clique sinaliza aceite das condições comerciais e logísticas prévias.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>

    {abrirPacoteModal && pacoteParaDetalhes && (
        <ModalDetalhesPacote 
          pacote={pacoteParaDetalhes} 
          onClose={() => setAbrirPacoteModal(false)} 
        />
      )}

      {equipamentoParaDetalhesId && (
        <ModalDetalhesEquipamento 
          equipamentoId={equipamentoParaDetalhesId} 
          onClose={() => setEquipamentoParaDetalhesId(null)} 
        />
      )}
    </>
  );
}

