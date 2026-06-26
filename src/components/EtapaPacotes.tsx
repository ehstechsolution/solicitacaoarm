import { useState, useEffect } from 'react';
import { OrcamentoFormData, Pacote } from '../types';
import { formatCurrency } from '../utils';
import { Sparkles, Check, Info, Settings, Loader2 } from 'lucide-react';
import ModalDetalhesPacote from './ModalDetalhesPacote';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface EtapaPacotesProps {
  formData: OrcamentoFormData;
  updateFields: (fields: Partial<OrcamentoFormData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

export default function EtapaPacotes({
  formData,
  updateFields,
  onValidationChange,
}: EtapaPacotesProps) {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [pacoteParaDetalhes, setPacoteParaDetalhes] = useState<Pacote | null>(null);

  useEffect(() => {
    const fetchPacotes = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'pacotes'), where('ativo', '==', true));
        const querySnapshot = await getDocs(q);
        const fetchedPacotes = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          pacote_id: doc.id
        })) as Pacote[];
        
        setPacotes(fetchedPacotes);
      } catch (err) {
        console.error("Erro ao buscar pacotes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPacotes();
  }, []);

  const handleSelectPackage = (pacote: Pacote) => {
    const isCustom = !!pacote.isPersonalizado;
    const subtotal = pacote.preco_venda;
    const total = isCustom ? 0 : subtotal + formData.taxaDeslocamento;

    updateFields({
      pacoteId: pacote.pacote_id,
      pacoteNome: pacote.titulo,
      pacotePreco: pacote.preco_venda,
      subtotal: subtotal,
      valorTotal: total,
    });
    
    onValidationChange(true); // Any selection is valid
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-electric-lime" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in px-1">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-xl mb-1 text-zinc-900 dark:text-white flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-electric-lime animate-pulse" />
          Escolha sua Experiência
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Selecione um de nossos pacotes ativos ou monte um projeto personalizado.
        </p>
      </div>

      {/* Package Card Stack (Vertical list for mobile layout) */}
      <div className="space-y-4">
        {pacotes.map((pacote) => {
          const isSelected = formData.pacoteId === pacote.pacote_id;
          const isCustom = !!pacote.isPersonalizado;

          return (
            <div
              key={pacote.pacote_id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectPackage(pacote)}
              className={`w-full text-left p-0 rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between border cursor-pointer select-none ${
                isSelected
                  ? isCustom
                    ? 'border-vibrant-orange bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white ring-2 ring-vibrant-orange/40 shadow-xl shadow-vibrant-orange/15'
                    : 'border-electric-lime bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white ring-2 ring-electric-lime/40 shadow-xl shadow-electric-lime/10'
                  : isCustom
                  ? 'border-dashed border-zinc-300 dark:border-zinc-700/80 bg-zinc-100/60 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-300 hover:border-vibrant-orange/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/45 text-zinc-800 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60'
              }`}
              id={`pacote-card-${pacote.pacote_id}`}
            >
              {/* Cover Image */}
              {pacote.foto_capa_url && (
                <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={pacote.foto_capa_url}
                    alt={pacote.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle top gradient shadow to ensure absolute readability of custom badges */}
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 via-black/10 to-transparent" />
                </div>
              )}

              {/* Highlight Badge */}
              {pacote.destaque && (
                <div className="absolute top-2 right-2 z-10 bg-electric-lime text-black font-mono font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-lg shadow-md">
                  Mais Vendido 🔥
                </div>
              )}

              {isCustom && (
                <div className="absolute top-2 right-2 z-10 bg-vibrant-orange text-white font-mono font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-lg shadow-md flex items-center gap-1">
                  <Settings className="w-2.5 h-2.5" /> Exclusivo
                </div>
              )}

              {/* Content Container */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="pr-12">
                  <h3 className="font-display font-extrabold text-base md:text-lg mb-1.5 flex items-center gap-1 text-zinc-900 dark:text-white">
                    {pacote.titulo}
                    {isSelected && (
                      <span className={isCustom ? 'text-vibrant-orange' : 'text-electric-lime'}>
                        <Check className="w-5 h-5 stroke-[3]" />
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed mb-4">
                    {pacote.descricao}
                  </p>
                </div>

                {/* Lower info block (Price display or custom messages) */}
                <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-3.5 flex flex-col gap-3 w-full">
                  {!isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPacoteParaDetalhes(pacote);
                      }}
                      className="w-full text-xs flex items-center justify-center gap-2 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-bold uppercase tracking-wider rounded-lg transition-colors"
                    >
                      <Info className="w-4 h-4" /> Ver detalhes do pacote
                    </button>
                  )}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Investimento
                    </span>
                    <span className={`font-display font-black text-lg ${isCustom ? 'text-vibrant-orange' : 'text-electric-lime'}`}>
                      {isCustom ? 'SOB CONSULTA' : formatCurrency(pacote.preco_venda)}
                    </span>
                  </div>
                </div>

                {/* Special interactive prompt for customized items */}
                {isCustom && isSelected && (
                  <div className="mt-4 p-4 rounded-xl border border-vibrant-orange/30 bg-vibrant-orange/5 text-xs text-zinc-800 dark:text-white leading-relaxed animate-fade-in flex gap-3">
                    <Info className="w-5 h-5 text-vibrant-orange flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Perfeito! Você quer algo exclusivo.</strong> Ao finalizar, seus dados irão direto para o <strong>Arthur</strong> para desenharem juntos o projeto dos seus sonhos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {pacoteParaDetalhes && (
        <ModalDetalhesPacote 
          pacote={pacoteParaDetalhes} 
          onClose={() => setPacoteParaDetalhes(null)} 
        />
      )}
    </div>
  );
}
