import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight, ShieldCheck, Zap, Sparkles, Award } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Equipamento } from '../types';

interface Props {
  equipamentoId: string;
  onClose: () => void;
}

export default function ModalDetalhesEquipamento({ equipamentoId, onClose }: Props) {
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchEquipamento = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'equipamentos', equipamentoId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setEquipamento({
            ...data,
            descricao_detalhada: data.descricao || data.descricao_detalhada
          } as Equipamento);
        }
      } catch (err) {
        console.error('Erro ao buscar equipamentos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipamento();
  }, [equipamentoId]);

  // Combina a foto de capa e fotos secundárias garantindo que sejam links válidos e sem duplicados
  const images = equipamento 
    ? [equipamento.foto_capa_url, ...(equipamento.fotos || [])].filter((v, i, a) => v && a.indexOf(v) === i) 
    : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 animate-fade-in">
      {/* Backdrop semi-transparente fosco premium */}
      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Card com Foco Total no Visual Mobile Light */}
      <div 
        className="relative w-full max-w-lg bg-white border border-zinc-100 rounded-[24px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col focus:outline-none transition-all duration-300"
        id="modal-detalhes-equipamento-premium"
      >
        {/* Botão de Fechar Absoluto com Efeito de Vidro */}
        <button 
          onClick={onClose} 
          className="absolute top-3.5 right-3.5 z-20 text-zinc-650 hover:text-[#F47B20] bg-white/80 hover:bg-white backdrop-blur-md p-2 rounded-full hover:scale-105 transition-all cursor-pointer border border-zinc-200/50 shadow-sm active:scale-95"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white">
            <Loader2 className="w-10 h-10 animate-spin text-[#B1D334]" />
            <span className="text-zinc-400 font-bold text-[9px] uppercase tracking-widest">Acessando Galeria...</span>
          </div>
        ) : equipamento ? (
          <>
            {/* Carousel Container - Com Fundo Claro Neutro e object-contain para exibição integral da imagem */}
            <div className="relative h-60 sm:h-72 w-full bg-zinc-50 border-b border-zinc-100 overflow-hidden group">
              {/* Overlay gradiente suave superior para leitura do botão */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/10 z-10 pointer-events-none"></div>

              {images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt={equipamento.nome} 
                  className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ease-out transform ${
                    idx === activeIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`} 
                  referrerPolicy="no-referrer"
                />
              ))}

              {/* Tag de Mídia da Categoria / Badge de Status em formato clean */}
              <div className="absolute bottom-3.5 left-3.5 z-15 flex flex-wrap gap-1.5 items-center">
                <span className="px-2 py-0.5 bg-[#B1D334] text-zinc-950 font-black text-[8px] uppercase tracking-wider rounded-md shadow-sm">
                  {equipamento.categoria}
                </span>
                <span className="px-2 py-0.5 bg-zinc-900 text-white font-black text-[8px] uppercase tracking-wider rounded-md border border-zinc-850 shadow-sm">
                  ARM SOM E LUZ
                </span>
              </div>

              {/* Paginação Indicador de Fotos */}
              {images.length > 1 && (
                <span className="absolute bottom-3.5 right-3.5 z-15 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white font-mono text-[9px] rounded-full border border-white/10 shadow-sm">
                  {activeIndex + 1} / {images.length}
                </span>
              )}
              
              {/* Controles de Navegação com Micro-Animações */}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveIndex(i => (i - 1 + images.length) % images.length)} 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-[#F47B20] text-white backdrop-blur-sm transition-all z-15 hover:scale-105 active:scale-95 border border-white/5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setActiveIndex(i => (i + 1) % images.length)} 
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-[#F47B20] text-white backdrop-blur-sm transition-all z-15 hover:scale-105 active:scale-95 border border-white/5"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Content Container - Cores suaves, elegantes e organizadas */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin bg-white text-zinc-900">
              {/* Título do Equipamento destacado */}
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-950 uppercase tracking-tight leading-snug">
                  {equipamento.nome}
                </h3>
                <div className="h-0.5 w-8 bg-[#B1D334] rounded-full mt-1"></div>
              </div>

              {/* Descrição Detalhada Comercial */}
              <div className="text-zinc-600 text-[11px] sm:text-xs leading-relaxed font-sans pr-1">
                {equipamento.descricao_detalhada ? (
                  equipamento.descricao_detalhada.split('\n').map((para, pIdx) => (
                    <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="italic text-zinc-400">
                    Equipamento calibrado e testado para montagem robusta e esteticamente impecável em eventos de alto nível.
                  </p>
                )}
              </div>

              {/* Botão de Fechar Integrado no Layout - Clean e Branco */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-zinc-50 border border-zinc-150 hover:bg-zinc-100 text-zinc-800 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                >
                  Fechar janela
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center space-y-3 bg-white">
            <p className="text-zinc-400 font-bold text-[11px]">Detalhes técnicos indisponíveis no momento.</p>
            <button
              onClick={onClose}
              className="py-1.5 px-3.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold rounded-lg text-[9px] uppercase border border-zinc-200 cursor-pointer"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
