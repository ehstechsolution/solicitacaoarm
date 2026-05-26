/**
 * Formatting and Helper Utilities for ARM Som e Luz
 */

// Formats a number to Brazilian Real (R$) currency string
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Applies masking to CEP (99999-999)
export function maskCEP(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

// Applies masking to WhatsApp Phone ((99) 99999-9999)
export function maskWhatsApp(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

// Applies masking to CPF (999.999.999-99)
export function maskCPF(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

// Applies masking to CNPJ (99.999.999/9999-99)
export function maskCNPJ(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  }
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

// Interface for ViaCEP response
interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

// Fetches address information from ViaCEP API
export async function buscarEnderecoCEP(cep: string): Promise<{
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  erro?: string;
} | null> {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) {
    return { rua: '', bairro: '', cidade: '', uf: '', erro: 'CEP deve conter 8 dígitos' };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    if (!response.ok) {
      throw new Error('Falha ao consultar API ViaCEP');
    }
    const data: ViaCepResponse = await response.json();
    if (data.erro === true || data.erro === 'true') {
      return { rua: '', bairro: '', cidade: '', uf: '', erro: 'CEP não encontrado' };
    }
    return {
      rua: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
    };
  } catch (error) {
    console.error('Erro ao consultar ViaCEP:', error);
    return { rua: '', bairro: '', cidade: '', uf: '', erro: 'Erro de conexão ao buscar o CEP' };
  }
}

// Simulates or calculates realistic transport/displacement fee based on the city from ARM headquarters in Americana/SP
export function calcularTaxaDeslocamento(cidade: string, uf: string): number {
  if (!cidade || uf.toUpperCase() !== 'SP') {
    // Other states or empty city gets a placeholder
    return 350.00;
  }
  const cidadeNorm = cidade.toLowerCase().trim();
  if (cidadeNorm.includes('americana')) {
    return 0.00; // Headquarters
  }
  if (cidadeNorm.includes('santa bárbara') || cidadeNorm.includes('barbara') || cidadeNorm.includes('nova odessa')) {
    return 50.00; // Bordering cities
  }
  if (cidadeNorm.includes('sumaré') || cidadeNorm.includes('hortolândia') || cidadeNorm.includes('hortolandia')) {
    return 80.00;
  }
  if (cidadeNorm.includes('campinas') || cidadeNorm.includes('paulinia') || cidadeNorm.includes('paulínia')) {
    return 120.00;
  }
  if (cidadeNorm.includes('piracicaba') || cidadeNorm.includes('limeira')) {
    return 140.00;
  }
  if (cidadeNorm.includes('são paulo') || cidadeNorm.includes('sao paulo') || cidadeNorm.includes('guarulhos') || cidadeNorm.includes('abc')) {
    return 350.00; // Capital region
  }
  return 180.00; // General state rate
}
