import React from 'react';
import { Calendar, AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEscolherOutraData: () => void;
}

export default function AgendaIndisponivelModal({ isOpen, onClose, onEscolherOutraData }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
           <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-vibrant-orange/10 rounded-full">
            <Calendar className="w-10 h-10 text-vibrant-orange" />
            <AlertTriangle className="w-5 h-5 text-zinc-50 dark:text-zinc-900 -mt-7 ml-5 bg-vibrant-orange rounded-full" />
          </div>
          
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-3">Data Indisponível</h2>
          
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            A ARM Som e Luz já possui um compromisso agendado para este dia. Nossa equipe técnica e equipamentos já estão empenhados em outro evento. Por favor, selecione outra data para podermos transformar o seu evento em um show!
          </p>
          
          <button
            onClick={onEscolherOutraData}
            className="w-full py-3.5 bg-vibrant-orange hover:bg-orange-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-vibrant-orange/20"
          >
            Escolher Outra Data
          </button>
        </div>
      </div>
    </div>
  );
}
