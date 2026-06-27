import React, { useState, useEffect } from 'react';
import { OrcamentoFormData, Pacote } from '../types';
import { formatCurrency } from '../utils';
import { Sparkles, Check, Info, Settings, Loader2, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import ModalDetalhesPacote from './ModalDetalhesPacote';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.m4v') ||
      cleanUrl.endsWith('.quicktime') ||
      url.includes('.mp4?') ||
      url.includes('.mov?') ||
      url.includes('.webm?') ||
      url.includes('/video/')
    );
  } catch (e) {
    return false;
  }
}

interface PacoteCarrosselProps {
  pacote: Pacote;
}

function PacoteCarrossel({ pacote }: PacoteCarrosselProps) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [pacote.pacote_id]);

  const list: string[] = [];
  if (pacote.foto_capa_url) {
    list.push(pacote.foto_capa_url);
  }
  if (pacote.fotos && Array.isArray(pacote.fotos)) {
    pacote.fotos.forEach(f => {
      if (f && f !== pacote.foto_capa_url && !list.includes(f)) {
        list.push(f);
      }
    });
  }

  if (list.length === 0) return null;

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setIndex((prev) => (prev === list.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev === list.length - 1 ? 0 : prev + 1));
  };

  const currentUrl = list[index];
  const isVideo = isVideoUrl(currentUrl);

  return (
    <div 
      className="relative w-full h-44 sm:h-52 overflow-hidden bg-zinc-950 flex items-center justify-center select-none"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isVideo ? (
        <video
          key={currentUrl}
          src={currentUrl}
          controls
          muted
          playsInline
          className="w-full h-full object-cover"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={currentUrl}
          alt={`${pacote.titulo} - mídia ${index + 1}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Video Indicator Badge */}
      {isVideo && (
        <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md text-white font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 pointer-events-none">
          <Video className="w-3 h-3 text-electric-lime" /> Vídeo
        </div>
      )}

      {/* Navigation Arrows */}
      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full z-20 cursor-pointer transition-all active:scale-90 hover:bg-black/80"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full z-20 cursor-pointer transition-all active:scale-90 hover:bg-black/80"
            aria-label="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
            {list.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === index ? 'bg-electric-lime w-3' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Subtle top gradient shadow to ensure absolute readability of custom badges */}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none" />
    </div>
  );
}

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
              {/* Cover Image/Video Carousel */}
              <PacoteCarrossel pacote={pacote} />

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
