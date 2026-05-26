import { useState, useRef, ChangeEvent } from 'react';
import { OrcamentoFormData, ClienteTipo } from '../types';
import { maskCPF, maskCNPJ, maskCEP, maskWhatsApp, buscarEnderecoCEP } from '../utils';
import { User, Phone, MapPin, Hash, Search, Loader2, Mail, Camera, Image as ImageIcon } from 'lucide-react';

interface EtapaContratanteProps {
  formData: OrcamentoFormData;
  updateFields: (fields: Partial<OrcamentoFormData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

export default function EtapaContratante({
  formData,
  updateFields,
  onValidationChange,
}: EtapaContratanteProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate fields in Step 1
  const validate = (updatedData: OrcamentoFormData) => {
    const isPF = updatedData.documentoTipo === 'PF';
    const docLength = updatedData.cpf.replace(/\D/g, '').length;
    
    const hasName = updatedData.nomeCompleto.trim().length >= 3;
    const hasDoc = isPF ? docLength === 11 : docLength === 14;
    const hasPhone = updatedData.telefone.replace(/\D/g, '').length === 11;
    
    // Check basic email format
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email.trim());
    
    const rawCEP = updatedData.cep.replace(/\D/g, '');
    const cleanLogradouro = updatedData.logradouro.trim();

    // CEP is required if street (logradouro) is empty. Street is required if CEP is empty.
    const hasValidCEP = rawCEP.length === 8;
    const hasValidLogradouro = cleanLogradouro.length >= 3;
    
    const isAddressValid = (hasValidCEP || hasValidLogradouro);

    onValidationChange(hasName && hasDoc && hasPhone && hasEmail && isAddressValid);
  };

  const handleTipoChange = (tipo: ClienteTipo) => {
    const updated = {
      ...formData,
      documentoTipo: tipo,
      cpf: '', // reset doc on change to prevent mask confusion
    };
    updateFields({ documentoTipo: tipo, cpf: '' });
    validate(updated);
  };

  const handleInput = (fields: Partial<OrcamentoFormData>) => {
    const updated = { ...formData, ...fields };
    updateFields(fields);
    validate(updated);
  };

  // Asynchronous Direct Cloudinary image upload using Fetch and Form Data API
  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError('');

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('upload_preset', 'perfil_clientes');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dnatvwcxy/image/upload', {
        method: 'POST',
        body: formDataToSend,
      });
      if (!response.ok) {
        throw new Error('Falha no upload do Cloudinary.');
      }
      const data = await response.json();
      if (data.secure_url) {
        handleInput({ fotoCliente: data.secure_url });
      } else {
        throw new Error('Nenhum secure_url retornado');
      }
    } catch (err) {
      console.error('Erro de upload Cloudinary:', err);
      setUploadError('Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Triggers input files popup click
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleCEPFetch = async () => {
    const rawCEP = formData.cep.replace(/\D/g, '');
    if (rawCEP.length !== 8) {
      setCepError('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setCepLoading(true);
    setCepError('');
    const result = await buscarEnderecoCEP(rawCEP);
    setCepLoading(false);

    if (result) {
      if (result.erro) {
        setCepError(result.erro);
        handleInput({ logradouro: '', bairro: '', cidade: '', estado: '' });
      } else {
        handleInput({
          logradouro: result.rua || '',
          bairro: result.bairro || '',
          cidade: result.cidade || '',
          estado: result.uf || '',
        });
      }
    } else {
      setCepError('Serviço ViaCEP indisponível. Preencha manualmente.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in px-1">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-xl mb-1 text-zinc-900 dark:text-white flex items-center justify-center gap-2">
          <User className="w-5 h-5 text-electric-lime" />
          Quem é você?
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Insira seus dados para contato, envio de documentos e proposta formal.
        </p>
      </div>

      {/* Cloudinary Profile Photo Section */}
      <div className="flex flex-col items-center justify-center space-y-2 mb-2">
        <div 
          onClick={triggerFileSelect}
          className="relative w-24 h-24 rounded-full border-2 border-zinc-300 dark:border-zinc-800 hover:border-electric-lime dark:hover:border-electric-lime cursor-pointer overflow-hidden transition-all duration-300 shadow bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center group"
          title="Fazer upload da foto"
        >
          {uploadLoading ? (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-[10px] text-white font-semibold">
              <Loader2 className="w-5 h-5 text-electric-lime animate-spin mb-1" />
              Carregando...
            </div>
          ) : (
            <>
              <img 
                src={formData.fotoCliente}
                alt="Foto do cliente"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = 'https://images.vexels.com/media/users/3/132335/isolated/preview/4af43ce1082231cba5e5aa60fbb03f2f-icones-de-circulo-de-staffs.png';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </>
          )}
        </div>
        
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={triggerFileSelect}
          className="text-[11px] font-bold text-electric-lime hover:underline cursor-pointer flex items-center gap-1.5"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {formData.fotoCliente.includes('staffs.png') ? 'Adicionar Foto de Perfil' : 'Alterar Foto'}
        </button>
        {uploadError && <p className="text-[10px] text-vibrant-orange font-medium">{uploadError}</p>}
      </div>

      {/* Segmented Control */}
      <div className="flex p-1 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl">
        <button
          type="button"
          onClick={() => handleTipoChange('PF')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            formData.documentoTipo === 'PF'
              ? 'bg-electric-lime text-black shadow-md font-bold'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white'
          }`}
          id="btn-pf"
        >
          Pessoa Física
        </button>
        <button
          type="button"
          onClick={() => handleTipoChange('PJ')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            formData.documentoTipo === 'PJ'
              ? 'bg-electric-lime text-black shadow-md font-bold'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white'
          }`}
          id="btn-pj"
        >
          Pessoa Jurídica
        </button>
      </div>

      {/* Inputs Form */}
      <div className="space-y-4">
        {/* Nome / Razão Social */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {formData.documentoTipo === 'PF' ? 'Nome Completo*' : 'Razão Social*'}
          </label>
          <div className="relative">
            <User className="absolute left-4 top-4 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={formData.documentoTipo === 'PF' ? 'Ex: Arthur de Souza' : 'Ex: ARM Eventos Som e Luz Ltda'}
              value={formData.nomeCompleto}
              onChange={(e) => handleInput({ nomeCompleto: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
              required
              id="input-nome-completo"
            />
          </div>
        </div>

        {/* Document (CPF / CNPJ) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {formData.documentoTipo === 'PF' ? 'CPF*' : 'CNPJ*'}
          </label>
          <div className="relative">
            <Hash className="absolute left-4 top-4 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={formData.documentoTipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
              value={formData.cpf}
              onChange={(e) => {
                const val = formData.documentoTipo === 'PF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
                handleInput({ cpf: val });
              }}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
              required
              id="input-cpf-cnpj"
            />
          </div>
        </div>

        {/* Co-Fields: WhatsApp and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Telefone / WhatsApp*
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-4 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="tel"
                placeholder="(19) 99999-9999"
                value={formData.telefone}
                onChange={(e) => handleInput({ telefone: maskWhatsApp(e.target.value) })}
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
                required
                id="input-telefone"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Email para Orçamento*
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="email"
                placeholder="nome@dominio.com"
                value={formData.email}
                onChange={(e) => handleInput({ email: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
                required
                id="input-email"
              />
            </div>
          </div>
        </div>

        {/* Endereço Title Indicator */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-electric-lime" />
            Endereço do Contratante
          </h3>
        </div>

        {/* CEP Residencial + ViaCEP Buscar */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            CEP {formData.logradouro.trim() === '' ? '*' : '(Opcional)'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="00000-000"
                value={formData.cep}
                maxLength={9}
                onChange={(e) => handleInput({ cep: maskCEP(e.target.value) })}
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
                id="input-cep"
              />
            </div>
            <button
              type="button"
              onClick={handleCEPFetch}
              disabled={cepLoading || formData.cep.replace(/\D/g, '').length !== 8}
              className="px-4 bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-300 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-200 dark:disabled:hover:bg-zinc-900 text-electric-lime rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 text-sm"
              id="btn-buscar-cep"
            >
              {cepLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </button>
          </div>
          {cepError && <p className="text-xs text-vibrant-orange font-medium">{cepError}</p>}
        </div>

        {/* Street Name (Logradouro) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Rua / Logradouro {formData.cep.replace(/\D/g, '').length !== 8 ? '*' : '(Opcional)'}
          </label>
          <input
            type="text"
            placeholder="Ex: Av. Brasil"
            value={formData.logradouro}
            onChange={(e) => handleInput({ logradouro: e.target.value })}
            className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white outline-none transition-all"
            id="input-logradouro"
          />
        </div>

        {/* Address Number & Complement */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Número
            </label>
            <input
              type="text"
              placeholder="Ex: 123"
              value={formData.numeroAddress}
              onChange={(e) => handleInput({ numeroAddress: e.target.value })}
              className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white outline-none transition-all"
              id="input-numero-address"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Complemento
            </label>
            <input
              type="text"
              placeholder="Ex: Apto 23 ou Bloco 1"
              value={formData.complemento}
              onChange={(e) => handleInput({ complemento: e.target.value })}
              className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white outline-none transition-all"
              id="input-complemento"
            />
          </div>
        </div>

        {/* Neighborhood, City and State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Bairro
            </label>
            <input
              type="text"
              placeholder="Ex: Centro"
              value={formData.bairro}
              onChange={(e) => handleInput({ bairro: e.target.value })}
              className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white outline-none transition-all"
              id="input-bairro"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cidade
            </label>
            <input
              type="text"
              placeholder="Ex: Americana"
              value={formData.cidade}
              onChange={(e) => handleInput({ cidade: e.target.value })}
              className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white outline-none transition-all"
              id="input-cidade"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Estado (UF)
            </label>
            <input
              type="text"
              placeholder="Ex: SP"
              value={formData.estado}
              maxLength={2}
              onChange={(e) => handleInput({ estado: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white outline-none transition-all"
              id="input-estado"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
