import { Pacote } from './types';

export const CATALOGO_PACOTES: Pacote[] = [
  {
    pacote_id: 'compacto',
    titulo: 'Pacote Compacto (Som & LED Básico)',
    descricao: 'Ideal para festas de aniversário, confraternizações pequenas e eventos em salões de condomínios. Inclui 2 caixas acústicas ativas, tripés, iluminação LED cênica integrada (4 refletores Par LED) e fiação estruturada.',
    preco_venda: 850.00,
    preco_custo_base: 400.00,
    ativo: true,
    criado_em: '2026-04-10T14:20:00.000Z',
    equipe_tecnica: [],
    equipamentos: [],
    destaque: false
  },
  {
    pacote_id: 'premium',
    titulo: 'Pista Premium (Ouro Som & Luz)',
    descricao: 'Perfeito para casamentos, formaturas de menor porte e baladas. Inclui estrutura em treliça de alumínio (Pórtico Q15/Q25), 4 refletores Moving Heads, máquina de fumaça, sistema de som profissional com Subwoofer de alta potência e cabine de DJ iluminada.',
    preco_venda: 2400.00,
    preco_custo_base: 1200.00,
    ativo: true,
    criado_em: '2026-04-10T14:20:00.000Z',
    equipe_tecnica: [],
    equipamentos: [],
    destaque: true
  },
  {
    pacote_id: 'master_show',
    titulo: 'Master Show & Painel de LED',
    descricao: 'Estruturação de alto padrão para grandes festas. Inclui Painel de LED de alta definição para transmissão, sistema de som Line Array, pistas iluminadas, DJs inclusos, efeitos especiais de faíscas frias (Sparklers) e técnico de som dedicado.',
    preco_venda: 5900.00,
    preco_custo_base: 3000.00,
    ativo: true,
    criado_em: '2026-04-10T14:20:00.000Z',
    equipe_tecnica: [],
    equipamentos: [],
    destaque: false
  },
  {
    pacote_id: 'personalizado',
    titulo: 'Pacote Personalizado',
    descricao: 'Desenvolva um projeto exclusivo com som de alta potência, iluminação de palco robotizada, pistas personalizadas de LED ou projeções mapeadas de acordo com as necessidades exatas do seu espaço.',
    preco_venda: 0,
    preco_custo_base: 0,
    ativo: true,
    criado_em: '2026-04-10T14:20:00.000Z',
    equipe_tecnica: [],
    equipamentos: [],
    isPersonalizado: true
  }
];
