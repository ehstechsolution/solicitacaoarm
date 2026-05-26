import { OrcamentoFormData } from '../types';
import { formatCurrency } from '../utils';
import { ShieldCheck, Receipt, DollarSign, Calendar, Eye } from 'lucide-react';
import { useEffect } from 'react';

interface EtapaResumoProps {
  formData: OrcamentoFormData;
  updateFields: (fields: Partial<OrcamentoFormData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

export default function EtapaResumo({
  formData,
  updateFields,
  onValidationChange,
}: EtapaResumoProps) {
  const isCustom = formData.pacoteId === 'personalizado';

  useEffect(() => {
    onValidationChange(true);
  }, [onValidationChange]);

  const handleCheckboxChange = () => {};

  // Pre-calculate 30% / 70% split
  const sinal = formData.valorTotal * 0.3;
  const saldo = formData.valorTotal * 0.7;

  return (
    <div className="space-y-6 animate-fade-in px-1">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-xl mb-1 text-zinc-900 dark:text-white flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-electric-lime" />
          Revisão Final
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Seu pedido será enviado para nossa equipe de análise. Assim que disponível, enviaremos o orçamento oficial em PDF no seu WhatsApp.
        </p>
      </div>

      {/* Basic Data Display */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        {/* Dados Pessoais */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
           Dados Pessoais
        </h3>
        <div className="text-sm space-y-1 text-zinc-900 dark:text-white">
            <p>{formData.nomeCompleto}</p>
            <p className="text-zinc-500 text-xs">{formData.email}</p>
            <p className="text-zinc-500 text-xs">{formData.telefone}</p>
        </div>

        {/* Dados do Evento */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
           Dados do Evento
        </h3>
        <div className="text-sm space-y-1 text-zinc-900 dark:text-white">
          <p>{formData.dataEvento.split('-').reverse().join('/')}</p>
            <p className="text-zinc-500 text-xs">{formData.tipoEvento}</p>
            <p className="text-zinc-500 text-xs">{formData.localEvento}</p>
        </div>
      </div>

      {/* Package Summary panel */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
          <Receipt className="w-4 h-4 text-electric-lime" /> Serviço Selecionado
        </h3>
        {/* Selected Package Name */}
        <div className="justify-between flex text-sm pt-2">
          <span className="text-zinc-500 dark:text-zinc-400">Pacote:</span>
          <span className="font-bold text-zinc-900 dark:text-white max-w-[200px] text-right truncate">
            {formData.pacoteNome}
          </span>
        </div>
      </div>
    </div>
  );
}
