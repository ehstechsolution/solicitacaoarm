export type ClienteTipo = 'PF' | 'PJ';

export interface Equipamento {
  equipamento_id: string;
  ativo: boolean;
  nome: string;
  categoria: string;
  descricao_detalhada: string;
  preco_aluguel_unitario: number;
  foto_capa_url: string;
  fotos: string[];
  criado_em: string;
}

export interface PacoteEquipamento {
  equipamento_id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  preco_aluguel_unitario: number;
}

export interface EquipeTecnica {
  funcao: string;
  quantidade: number;
  custo_diaria: number;
}

export interface Pacote {
  pacote_id: string;
  titulo: string;
  descricao: string;
  preco_venda: number;
  preco_custo_base: number;
  ativo: boolean;
  criado_em: any; // Timestamp or string
  equipe_tecnica: EquipeTecnica[];
  equipamentos: PacoteEquipamento[];
  destaque?: boolean;
  isPersonalizado?: boolean;
  foto_capa_url?: string;
  fotos?: string[];
}

export interface OrcamentoFormData {
  // Etapa 1: Dados do Contratante (strictly aligned with 'clientes' Firestore schema)
  tipoCliente: string; // Internal: Starts as "Lead frio"
  documentoTipo: ClienteTipo; // In the UI to select masking
  nomeCompleto: string; // Nome completo do cliente, obrigátorio
  cpf: string; // com mascara e validação, can hold CNPJ too but saved in 'cpf' field
  cep: string; // cep do contratante
  logradouro: string; // rua do endereço
  numeroAddress: string; // número do endereço
  bairro: string; // bairro do endereço
  cidade: string; // cidade do endereço
  estado: string; // estado UF do endereço
  complemento: string; // complemento do endereço
  telefone: string; // telefone, obrigatório
  email: string; // email, obrigatório
  fotoCliente: string; // upload - perfil_clientes preset

  // Etapa 2: Dados do Evento
  tipoEvento: string;
  dataEvento: string;
  horarioInicio: string;
  localEvento: string;
  cepLocal: string;
  logradouroLocal: string;
  numeroLocal: string;
  bairroLocal: string;
  cidadeLocal: string;
  estadoLocal: string;
  complementoLocal: string;
  cidadeUfLocal: string; // Resolvido via ViaCEP ou digitado

  // Etapa 3: Escolha a Experiência
  pacoteId: string;
  pacoteNome: string;
  pacotePreco: number;

  // Etapa 4: Resumo Financeiro e Termos
  subtotal: number;
  taxaDeslocamento: number;
  valorTotal: number;
  aceiteEnergia: boolean;
  aceitePalco: boolean;
  aceiteImagem: boolean;
}
