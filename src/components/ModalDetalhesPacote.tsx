import React, { useState, useEffect } from 'react';
import { X, Info, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Pacote } from '../types';
import ModalDetalhesEquipamento from './ModalDetalhesEquipamento';

interface Props {
  pacote: Pacote;
  onClose: () => void;
}

function EquipamentoThumbnail({ id }: { id: string }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'equipamentos', id)).then(snap => {
      if (snap.exists()) setPhoto(snap.data().foto_capa_url);
      setLoading(false);
    });
  }, [id]);

  return (
    <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
       photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : null}
    </div>
  );
}

export default function ModalDetalhesPacote({ pacote, onClose }: Props) {
  const [equipamentoIdParaDetalhes, setEquipamentoIdParaDetalhes] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative w-full max-w-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto mt-10 sm:mt-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">{pacote.titulo}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">{pacote.descricao}</p>
          
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Equipamentos Inclusos:</h3>
          <ul className="space-y-2 mb-6">
            {pacote.equipamentos?.map((eq) => (
              <li key={eq.equipamento_id} className="flex justify-between items-center text-sm p-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <EquipamentoThumbnail id={eq.equipamento_id} />
                  <span className="text-zinc-900 dark:text-white font-medium">{eq.nome}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEquipamentoIdParaDetalhes(eq.equipamento_id)}
                  className="text-electric-lime hover:text-lime-400 font-bold p-2"
                >
                  <Info className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Equipe Técnica:</h3>
          <ul className="space-y-1 mb-2">
            {pacote.equipe_tecnica?.map((mem, i) => (
              <li key={i} className="flex justify-between items-center text-sm p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <span className="text-zinc-900 dark:text-white">{mem.funcao}</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">x{mem.quantidade}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {equipamentoIdParaDetalhes && (
        <ModalDetalhesEquipamento 
          equipamentoId={equipamentoIdParaDetalhes} 
          onClose={() => setEquipamentoIdParaDetalhes(null)} 
        />
      )}
    </>
  );
}
