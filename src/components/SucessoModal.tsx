import { OrcamentoFormData } from '../types';
import { formatCurrency } from '../utils';
import { CheckCircle2, PhoneCall } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface SucessoModalProps {
  formData: OrcamentoFormData;
  docId: string;
  onRestart: () => void;
}

export default function SucessoModal({ formData, docId, onRestart }: SucessoModalProps) {
  const [whatsappNumber, setWhatsappNumber] = useState('5514996971739');
  
  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const docRef = doc(db, 'config', 'empresa');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            setWhatsappNumber(snap.data().telefone || '5514996971739');
        }
      } catch (e) {
        console.error('Erro ao buscar telefone:', e);
      }
    };
    fetchEmpresa();
  }, []);

  const makeWhatsAppMessage = () => {
    const textMsg = `Olá Artur! Fiz um orçamento de Som e Luz no App:
*Cliente:* ${formData.nomeCompleto}
*Local:* ${formData.localEvento} (${formData.cidadeUfLocal})
*Data:* ${formData.dataEvento.split('-').reverse().join('/')} às ${formData.horarioInicio}h
*Pacote Selecionado:* ${formData.pacoteNome}`;

    return encodeURIComponent(textMsg);
  };

  const handleWhatsAppRedirect = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${makeWhatsAppMessage()}`;
    window.open(url, '_blank', 'noreferrer');
  };

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

        {/* Action Button: WhatsApp */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleWhatsAppRedirect}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            id="btn-whatsapp-redirect"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            VOLTAR AO WHATSAPP
          </button>
        </div>

      </div>
    </div>
  );
}
