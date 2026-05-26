import { useState, useEffect } from 'react';
import { OrcamentoFormData } from '../types';
import { maskCEP, buscarEnderecoCEP } from '../utils';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format, parseISO, getDay } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Loader2, 
  Heart, 
  Award, 
  Cake, 
  Briefcase, 
  Music,
  Building,
  Info,
  CheckCircle,
} from 'lucide-react';

interface EtapaEventoProps {
  formData: OrcamentoFormData;
  updateFields: (fields: Partial<OrcamentoFormData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const EVENT_TYPES = [
  { id: 'Casamento', label: 'Casamento', icon: Heart },
  { id: 'Formatura', label: 'Formatura', icon: Award },
  { id: 'Aniversário', label: 'Aniversário', icon: Cake },
  { id: 'Corporativo', label: 'Corporativo', icon: Briefcase },
  { id: 'Show/Evento Público', label: 'Show / Evento Público', icon: Music },
];

export default function EtapaEvento({
  formData,
  updateFields,
  onValidationChange,
}: EtapaEventoProps) {
  const [cidadesList, setCidadesList] = useState<any[]>([]);
  const [cidadesConfig, setCidadesConfig] = useState<any>(null); // For agenda config
  const [dateValidation, setDateValidation] = useState({loading: false, isValid: true, message: ''});
  const [loadingCidades, setLoadingCidades] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  // Fetch cities configuration from Firestore configuration doc
  useEffect(() => {
    const fetchCidades = async () => {
      try {
        const docRef = doc(db, 'config', 'cidades');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.itens)) {
            setCidadesList(data.itens);
          } else {
            console.warn('ARM Som e Luz - Documento config/cidades não contém array "itens"', data);
          }
        } else {
          console.error('ARM Som e Luz - O documento config/cidades não existe no Firestore.');
        }
      } catch (e) {
        console.error('Erro ao buscar cidades no Firestore:', e);
      } finally {
        setLoadingCidades(false);
      }
    };
    fetchCidades();
  }, []);

  const validateEventDate = async (dateStr: string) => {
    if (!dateStr || dateStr.length !== 10) {
      setDateValidation({loading: false, isValid: false, message: 'Data inválida.'});
      return false;
    }

    setDateValidation({loading: true, isValid: false, message: ''});
    
    try {
      // 1. Fetch agenda config (if not loaded)
      let agenda = cidadesConfig;
      if (!agenda) {
        const docRef = doc(db, 'config', 'agenda');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          agenda = docSnap.data();
          setCidadesConfig(agenda);
        }
      }

      const dateObj = parseISO(dateStr);
      const dayIndex = getDay(dateObj); // 0 = Sunday
      const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const dayName = weekDays[dayIndex];

      // 2. Rule: Weekday check
      if (agenda && agenda.dias) {
        const dayConfig = agenda.dias.find((d: any) => d.dia === dayName);
        if (dayConfig && !dayConfig.ativo) {
          setDateValidation({loading: false, isValid: false, message: `A ARM Som e Luz não realiza eventos aos ${dayName}s. Por favor, escolha outra data.`});
          return false;
        }
      }

      // 3. Rule: Holiday/Lock check
      const q = query(
        collection(db, 'config/agenda/holiday'), 
        where('data_holiday', '==', dateStr)
      );
      const querySnapshot = await getDocs(q);
      
      let isHolidayOrLocked = false;
      querySnapshot.forEach((doc) => {
        if (doc.data().ativo === true) {
          isHolidayOrLocked = true;
        }
      });

      if (isHolidayOrLocked) {
        setDateValidation({loading: false, isValid: false, message: 'A data selecionada não está disponível em nossa agenda. Por favor, escolha outro dia.'});
        return false;
      }

      setDateValidation({loading: false, isValid: true, message: ''});
      return true;
    } catch (e) {
      console.error('Erro na validação de data:', e);
      setDateValidation({loading: false, isValid: true, message: ''}); // Fail open safely
      return true;
    }
  };

  const normalizeString = (val: string | number): string => {
    if (!val) return '';
    return String(val)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Strips diacritics / accents
      .replace(/[^a-z0-9]/g, '')       // Alphanumeric only
      .trim();
  };

  const getCustoDeslocamento = (cidadeName: string): { taxa: number; encontrada: boolean } => {
    if (!cidadeName) return { taxa: 0, encontrada: false };
    
    // Extract city name before any suffix
    const cleanCityName = cidadeName.split('-')[0].split('/')[0].split(',')[0].trim();
    const searchNorm = normalizeString(cleanCityName);
    
    const matched = cidadesList.find((item: any) => {
      if (!item?.cidade) return false;
      return normalizeString(item.cidade) === searchNorm;
    });

    if (matched) {
      return { taxa: Number(matched.custo_cidade || 0), encontrada: true };
    }

    return { taxa: 0, encontrada: false };
  };

  // Validate fields in Step 2
  const validate = (updatedData: OrcamentoFormData) => {
    const rawCEP = updatedData.cepLocal.replace(/\D/g, '');
    const isCepValid = rawCEP.length === 8;
    const hasStreet = updatedData.logradouroLocal.trim().length >= 3;
    const hasCity = updatedData.cidadeLocal.trim().length >= 3;
    const hasState = updatedData.estadoLocal.trim().length === 2;

    // "se o usuário não souber o cep, ele digita o endereço completo, se tiver o cep, a rua/logradouro não é obrigatório, se a rua/logradouro for vazia então o cep é obrigatório"
    const isAddressValid = (isCepValid || hasStreet) && hasCity && hasState;

    const hasDate = updatedData.dataEvento.trim().length === 10;
    const hasTime = updatedData.horarioInicio.trim().length === 5;
    const hasLocal = updatedData.localEvento.trim().length >= 3;
    const hasType = updatedData.tipoEvento.trim().length > 0;

    onValidationChange(hasDate && dateValidation.isValid && hasTime && hasLocal && hasType && isAddressValid);
  };

  const handleInput = (fields: Partial<OrcamentoFormData>) => {
    const updated = { ...formData, ...fields };
    updateFields(fields);
    validate(updated);
  };

  // Synchronize dynamic travel fee when cidades list finishes loading or city transitions
  useEffect(() => {
    if (cidadesList.length > 0 && formData.cidadeLocal) {
      const { taxa } = getCustoDeslocamento(formData.cidadeLocal);
      if (formData.taxaDeslocamento !== taxa) {
        handleInput({
          taxaDeslocamento: taxa,
          valorTotal: formData.subtotal + taxa,
        });
      }
    }
  }, [cidadesList, formData.cidadeLocal]);

  // Automatic ViaCEP Trigger when Cep has 8 characters
  useEffect(() => {
    const rawCEP = formData.cepLocal.replace(/\D/g, '');
    if (rawCEP.length === 8) {
      handleCEPLocalFetch(rawCEP);
    }
  }, [formData.cepLocal]);

  const handleCEPLocalFetch = async (targetCep?: string) => {
    const rawCEP = (targetCep || formData.cepLocal).replace(/\D/g, '');
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
        handleInput({
          logradouroLocal: '',
          bairroLocal: '',
          cidadeLocal: '',
          estadoLocal: '',
          cidadeUfLocal: '',
          taxaDeslocamento: 0,
        });
      } else {
        const resolvedCityUf = `${result.cidade} - ${result.uf}`;
        const { taxa } = getCustoDeslocamento(result.cidade);
        
        handleInput({
          logradouroLocal: result.rua || '',
          bairroLocal: result.bairro || '',
          cidadeLocal: result.cidade || '',
          estadoLocal: result.uf || '',
          cidadeUfLocal: resolvedCityUf,
          taxaDeslocamento: taxa,
          valorTotal: formData.subtotal + taxa,
        });
      }
    } else {
      setCepError('ViaCEP indisponível. Preencha manualmente.');
    }
  };

  const handleManualAddressChange = (fields: Partial<OrcamentoFormData>) => {
    const nextCity = fields.cidadeLocal !== undefined ? fields.cidadeLocal : formData.cidadeLocal;
    const nextState = fields.estadoLocal !== undefined ? fields.estadoLocal : formData.estadoLocal;
    
    const resolvedCityUf = nextCity && nextState ? `${nextCity} - ${nextState.toUpperCase()}` : '';
    const { taxa } = getCustoDeslocamento(nextCity);

    handleInput({
      ...fields,
      cidadeUfLocal: resolvedCityUf,
      taxaDeslocamento: taxa,
      valorTotal: formData.subtotal + taxa,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in px-1">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-xl mb-1 text-zinc-900 dark:text-white flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5 text-electric-lime" />
          Onde e Quando?
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Detalhes de data, hora e logística para cálculo de deslocamento.
        </p>
      </div>

      <div className="space-y-5">
        {/* Tipo de Evento */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Tipo de Evento*
          </label>
          <div className="grid grid-cols-2 gap-2" id="evento-tipos-grid">
            {EVENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.tipoEvento === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleInput({ tipoEvento: type.id })}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 outline-none ${
                    isSelected
                      ? 'bg-electric-lime border-electric-lime text-black shadow-md font-bold'
                      : 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                  id={`btn-evento-tipo-${type.id}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-black' : 'text-electric-lime'}`} />
                  <span className="text-xs truncate">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Time Fields Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Date of Event */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Data do Evento*
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="date"
                value={formData.dataEvento}
                onChange={(e) => {
                  const val = e.target.value;
                  handleInput({ dataEvento: val });
                  validateEventDate(val);
                }}
                className={`w-full pl-10 pr-3 py-3 bg-white dark:bg-zinc-950 border ${dateValidation.isValid ? 'border-zinc-300 dark:border-zinc-800' : 'border-vibrant-orange'} text-zinc-900 dark:text-white rounded-xl focus:border-electric-lime focus:ring-1 focus:ring-electric-lime outline-none text-sm transition-all`}
                required
                id="input-data-evento"
              />
              <div className="absolute right-3 top-3.5">
                {dateValidation.loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-electric-lime" />
                ) : null}
              </div>
            </div>
            {dateValidation.message && (
              <p className="text-xs text-vibrant-orange font-medium mt-1">{dateValidation.message}</p>
            )}
            {!dateValidation.loading && dateValidation.isValid && formData.dataEvento.length === 10 && (
              <div className="flex items-center gap-1 mt-1 text-electric-lime">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Data disponível</span>
              </div>
            )}
          </div>

          {/* Start Time of Event */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Horário de Início*
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="time"
                value={formData.horarioInicio}
                onChange={(e) => handleInput({ horarioInicio: e.target.value })}
                className="w-full pl-10 pr-3 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl focus:border-electric-lime focus:ring-1 focus:ring-electric-lime outline-none text-sm transition-all"
                required
                id="input-hora-inicio"
              />
            </div>
          </div>
        </div>

        {/* Local do Evento Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Nome do Local do Evento*
          </label>
          <div className="relative">
            <Building className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Ex: Engenho Eventos ou Chácara Recanto"
              value={formData.localEvento}
              onChange={(e) => handleInput({ localEvento: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none text-sm transition-all"
              required
              id="input-local-evento-nome"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-350 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-electric-lime" />
            Endereço de Realização
          </h3>
        </div>

        {/* CEP do Local do Evento */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              CEP do Local {formData.logradouroLocal.trim() === '' ? '*' : '(Opcional)'}
            </label>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Busca automática do endereço
            </span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="00000-000"
                value={formData.cepLocal}
                maxLength={9}
                onChange={(e) => handleInput({ cepLocal: maskCEP(e.target.value) })}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none text-sm transition-all"
                id="input-cep-local"
              />
            </div>
            <button
              type="button"
              onClick={() => handleCEPLocalFetch()}
              disabled={cepLoading || formData.cepLocal.replace(/\D/g, '').length !== 8}
              className="px-4 bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-300 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 disabled:opacity-40 text-electric-lime rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 text-xs font-semibold"
              id="btn-buscar-cep-local"
            >
              {cepLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Buscar
            </button>
          </div>
          {cepError && <p className="text-xs text-vibrant-orange font-medium">{cepError}</p>}
        </div>

        {/* Logradouro / Rua (Manual & Autofill) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Rua / Logradouro {formData.cepLocal.replace(/\D/g, '').length !== 8 ? '*' : '(Opcional)'}
          </label>
          <input
            type="text"
            placeholder="Ex: Rodovia Anhanguera, km 120"
            value={formData.logradouroLocal}
            onChange={(e) => handleManualAddressChange({ logradouroLocal: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white text-sm outline-none transition-all"
            id="input-logradouro-local"
          />
        </div>

        {/* Address Number & Complement fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Número do Local
            </label>
            <input
              type="text"
              placeholder="Ex: 150 ou S/N"
              value={formData.numeroLocal}
              onChange={(e) => handleInput({ numeroLocal: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white text-sm outline-none transition-all"
              id="input-numero-local"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Complemento
            </label>
            <input
              type="text"
              placeholder="Ex: Bloco B ou Lagoa"
              value={formData.complementoLocal}
              onChange={(e) => handleInput({ complementoLocal: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white text-sm outline-none transition-all"
              id="input-complemento-local"
            />
          </div>
        </div>

        {/* Bairro, Cidade and Estado UF */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Bairro
            </label>
            <input
              type="text"
              placeholder="Ex: Zona Rural"
              value={formData.bairroLocal}
              onChange={(e) => handleInput({ bairroLocal: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white text-sm outline-none transition-all"
              id="input-bairro-local"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cidade*
            </label>
            <input
              type="text"
              placeholder="Ex: São Manuel"
              value={formData.cidadeLocal}
              onChange={(e) => handleManualAddressChange({ cidadeLocal: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white text-sm outline-none transition-all"
              required
              id="input-cidade-local"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Estado (UF)*
            </label>
            <input
              type="text"
              placeholder="Ex: SP"
              value={formData.estadoLocal}
              maxLength={2}
              onChange={(e) => handleManualAddressChange({ estadoLocal: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-electric-lime focus:ring-1 focus:ring-electric-lime rounded-xl text-zinc-900 dark:text-white text-sm outline-none transition-all"
              required
              id="input-estado-local"
            />
          </div>
        </div>

        {/* Travel Deslocamento Fee Preview box */}
        {formData.cidadeUfLocal && (() => {
          const { taxa, encontrada } = getCustoDeslocamento(formData.cidadeLocal);
          return (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-2 animate-fade-in text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-electric-lime uppercase tracking-wider text-[9px]">
                  Cidade de Realização
                </span>
                <span className="text-[10px] font-mono font-bold bg-electric-lime/10 text-electric-lime px-2 py-0.5 rounded">
                  {formData.estadoLocal || 'SP'}
                </span>
              </div>
              <p className="font-medium text-zinc-900 dark:text-white text-sm">{formData.cidadeUfLocal}</p>
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 flex justify-between items-center">
                <span className="text-zinc-500">Taxa de Deslocamento:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {loadingCidades ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin inline-block text-electric-lime" />
                  ) : encontrada ? (
                    taxa === 0 ? 'Isento / Cortesia' : `R$ ${taxa.toFixed(2)}`
                  ) : (
                    <span className="text-vibrant-orange font-medium text-[11px] normal-case bg-vibrant-orange/10 px-2 py-0.5 rounded">
                      Taxa de deslocamento será calculada posteriormente
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
