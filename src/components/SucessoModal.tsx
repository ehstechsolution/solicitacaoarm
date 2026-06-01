import { OrcamentoFormData } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface SucessoModalProps {
  formData: OrcamentoFormData;
  docId: string;
  onRestart: () => void;
}

export default function SucessoModal({ formData, docId, onRestart }: SucessoModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl dark:shadow-electric-lime/10 space-y-6">
        
        {/* Success Icon Animation container */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-electric-lime/20 rounded-full blur-xl animate-pulse"></div>
            <CheckCircle2 className="w-16 h-16 text-electric-lime relative" />
          </div>
        </div>

        {/* Message and Document Reference */}
        <div>
          <h2 className="font-display font-black text-2xl text-zinc-950 dark:text-white tracking-tight">
            ORÇAMENTO ENVIADO!
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 px-2">
            Sua solicitação de reserva de data foi gravada com sucesso no sistema.
          </p>
        </div>

        {/* Action Button: Novo Orçamento */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-[#B1D334] hover:bg-[#B1D334]/90 text-zinc-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#B1D334]/25"
            id="btn-novo-orcamento"
          >
            FAZER NOVO ORÇAMENTO
          </button>
        </div>

      </div>
    </div>
  );
}
