export const APP_NAME = 'Finance Quest';
export const SAVE_VERSION = 2;

export const SLOT_ORDER = [
  { key: 'head', label: 'Planejamento' },
  { key: 'shoulders', label: 'Proteção' },
  { key: 'chest', label: 'Consistência' },
  { key: 'hands', label: 'Execução' },
  { key: 'neck', label: 'Visão' },
  { key: 'mainHand', label: 'Estratégia principal' },
  { key: 'offHand', label: 'Estratégia secundária' },
  { key: 'feet', label: 'Movimento' },
  { key: 'ring1', label: 'Hábito', accepts: ['ring'] },
  { key: 'ring2', label: 'Revisão', accepts: ['ring'] },
];

export const EMPTY_EQUIPMENT = SLOT_ORDER.reduce((equipment, slot) => {
  equipment[slot.key] = null;
  return equipment;
}, {});

export const RARITY_META = {
  comum: { label: 'Básico', color: '#8FA6BA', score: 8 },
  raro: { label: 'Intermediário', color: '#62D6A6', score: 14 },
  epico: { label: 'Avançado', color: '#5AC8FA', score: 22 },
  lendario: { label: 'Excelente', color: '#F6C453', score: 34 },
  artefato: { label: 'Especial', color: '#FF7A6B', score: 48 },
};

export const CHARACTER_RACES = [
  {
    key: 'iniciante',
    label: 'Organizador iniciante',
    bonus: 'Começa com foco em reserva e clareza.',
  },
  {
    key: 'equilibrado',
    label: 'Perfil equilibrado',
    bonus: 'Combina segurança, aprendizado e diversificação.',
  },
  {
    key: 'analitico',
    label: 'Perfil analítico',
    bonus: 'Valoriza dados, comparações e histórico.',
  },
];

export const CHARACTER_CLASSES = [
  {
    key: 'reserva',
    label: 'Trilha da Reserva',
    bonus: 'Prioriza liquidez, emergência e previsibilidade.',
  },
  {
    key: 'diversificacao',
    label: 'Trilha da Diversificação',
    bonus: 'Explora classes diferentes com risco consciente.',
  },
  {
    key: 'longo-prazo',
    label: 'Trilha do Longo Prazo',
    bonus: 'Reforça constância, tempo e revisão periódica.',
  },
];

export const INVESTMENT_TYPES = {
  'tesouro-selic': {
    title: 'Tesouro Selic',
    category: 'renda fixa',
    keywords: ['tesouro selic', 'selic', 'tesouro direto', 'título público', 'titulo publico'],
    baseXp: 90,
    power: 18,
    learning:
      'Boa referência para reserva de emergência por combinar liquidez, baixo risco e acompanhamento simples.',
  },
  'tesouro-ipca': {
    title: 'Tesouro IPCA+',
    category: 'renda fixa',
    keywords: ['tesouro ipca', 'ipca+', 'ntn-b', 'inflação', 'inflacao'],
    baseXp: 110,
    power: 22,
    learning:
      'Ajuda a pensar em proteção contra inflação quando o objetivo tem prazo mais longo.',
  },
  cdb: {
    title: 'CDB',
    category: 'renda fixa',
    keywords: ['cdb', 'certificado de depósito', 'certificado de deposito', 'banco emissor'],
    baseXp: 95,
    power: 19,
    learning:
      'Permite comparar rentabilidade, prazo, liquidez, emissor e cobertura do FGC.',
  },
  'lci-lca': {
    title: 'LCI/LCA',
    category: 'renda fixa',
    keywords: ['lci', 'lca', 'agronegócio', 'agronegocio', 'imobiliário', 'imobiliario'],
    baseXp: 100,
    power: 20,
    learning:
      'Reforça a análise de prazo, isenção de IR, liquidez e garantia para pessoa física.',
  },
  fii: {
    title: 'Fundo Imobiliário',
    category: 'renda variável',
    keywords: ['fii', 'fundo imobiliário', 'fundo imobiliario', 'hglg11', 'mxrf11', 'dividend yield'],
    baseXp: 120,
    power: 25,
    learning:
      'Estimula leitura de vacância, contratos, recorrência de rendimentos e diversificação.',
  },
  acao: {
    title: 'Ação',
    category: 'renda variável',
    keywords: ['ação', 'acao', 'ações', 'acoes', 'b3', 'ticker', 'petrobras', 'vale3', 'itub4'],
    baseXp: 130,
    power: 28,
    learning:
      'Exige leitura de negócio, risco, governança, preço e horizonte de investimento.',
  },
  etf: {
    title: 'ETF',
    category: 'diversificação',
    keywords: ['etf', 'ivvb11', 'bova11', 'smal11', 'índice', 'indice', 's&p', 'sp500'],
    baseXp: 125,
    power: 27,
    learning:
      'Facilita exposição diversificada e comparação com índices de referência.',
  },
  bdr: {
    title: 'BDR',
    category: 'global',
    keywords: ['bdr', 'recibo', 'apple', 'google', 'nvidia', 'mercado global'],
    baseXp: 135,
    power: 29,
    learning:
      'Conecta o usuário a empresas globais e à variação cambial com responsabilidade.',
  },
  'fundo-previdencia': {
    title: 'Fundo de Previdência',
    category: 'longo prazo',
    keywords: ['previdência', 'previdencia', 'pgbl', 'vgbl', 'aposentadoria'],
    baseXp: 115,
    power: 24,
    learning:
      'Ajuda a organizar horizonte, tributação, taxa de administração e disciplina.',
  },
  'aporte-manual': {
    title: 'Registro manual',
    category: 'organização',
    keywords: [],
    baseXp: 70,
    power: 12,
    learning:
      'Um registro manual mantém a jornada ativa quando o comprovante não traz detalhes suficientes.',
  },
};

export const SET_BONUSES = {
  'Trilha da Reserva Estável': {
    category: 'renda fixa',
    affectedTypes: ['tesouro-selic', 'tesouro-ipca', 'cdb', 'lci-lca'],
    lore: 'Marcos voltados a reserva, liquidez e renda fixa consciente.',
    bonuses: [
      { pieces: 2, label: '+10% XP em renda fixa', xpMultiplier: 1.1, power: 12 },
      { pieces: 4, label: '+18% XP em renda fixa e +18 de pontuação', xpMultiplier: 1.18, power: 18 },
    ],
  },
  'Trilha da Diversificação Global': {
    category: 'diversificação',
    affectedTypes: ['etf', 'bdr', 'acao', 'fii'],
    lore: 'Marcos para comparar riscos, setores e moedas diferentes.',
    bonuses: [
      { pieces: 2, label: '+8% XP em ativos diversificados', xpMultiplier: 1.08, power: 10 },
      { pieces: 4, label: '+16% XP em diversificação e +16 de pontuação', xpMultiplier: 1.16, power: 16 },
    ],
  },
  'Trilha Previdenciária': {
    category: 'longo prazo',
    affectedTypes: ['fundo-previdencia', 'tesouro-ipca', 'etf'],
    lore: 'Marcos de constância para objetivos que dependem de tempo.',
    bonuses: [
      { pieces: 2, label: '+9% XP em longo prazo', xpMultiplier: 1.09, power: 11 },
      { pieces: 4, label: '+15% XP em longo prazo e +20 de pontuação', xpMultiplier: 1.15, power: 20 },
    ],
  },
};

export const ITEM_LIBRARY = [
  {
    id: 'plano-reserva-emergencia',
    name: 'Plano da Reserva de Emergência',
    slot: 'head',
    type: 'tesouro-selic',
    category: 'renda fixa',
    rarity: 'comum',
    setName: 'Trilha da Reserva Estável',
    requiredAmount: 250,
    power: 16,
    bonusLabel: '+6 de pontuação em liquidez',
    flavor: 'Define uma base simples antes de qualquer decisão mais arriscada.',
    lore: 'Reserva de emergência é uma das primeiras proteções de uma vida financeira organizada.',
  },
  {
    id: 'escudo-liquidez-diaria',
    name: 'Escudo da Liquidez Diária',
    slot: 'shoulders',
    type: 'tesouro-selic',
    category: 'renda fixa',
    rarity: 'raro',
    setName: 'Trilha da Reserva Estável',
    requiredAmount: 500,
    power: 22,
    bonusLabel: '+8 de pontuação em acesso ao dinheiro',
    flavor: 'Reforça que dinheiro de emergência precisa estar disponível.',
    lore: 'Liquidez evita vender investimentos ruins no pior momento.',
  },
  {
    id: 'colete-cdb-comparado',
    name: 'Colete do CDB Comparado',
    slot: 'chest',
    type: 'cdb',
    category: 'renda fixa',
    rarity: 'epico',
    setName: 'Trilha da Reserva Estável',
    requiredAmount: 1000,
    power: 30,
    bonusLabel: '+10 de pontuação em análise de emissor',
    flavor: 'Compara prazo, taxa, liquidez e proteção do FGC.',
    lore: 'Nem todo CDB serve ao mesmo objetivo; contexto importa.',
  },
  {
    id: 'luvas-lci-lca-isenta',
    name: 'Luvas da LCI/LCA Isenta',
    slot: 'hands',
    type: 'lci-lca',
    category: 'renda fixa',
    rarity: 'lendario',
    setName: 'Trilha da Reserva Estável',
    requiredAmount: 1500,
    power: 38,
    bonusLabel: '+12 de pontuação em comparação líquida',
    flavor: 'Lembra que isenção de IR não dispensa análise de prazo.',
    lore: 'A rentabilidade líquida deve ser comparada com alternativas equivalentes.',
  },
  {
    id: 'radar-fiis-recorrencia',
    name: 'Radar de FIIs e Recorrência',
    slot: 'neck',
    type: 'fii',
    category: 'renda variável',
    rarity: 'raro',
    setName: 'Trilha da Diversificação Global',
    requiredAmount: 700,
    power: 24,
    bonusLabel: '+8 de pontuação em renda imobiliária',
    flavor: 'Reforça a leitura de vacância, contratos e recorrência.',
    lore: 'FIIs combinam renda, risco de mercado e risco imobiliário.',
  },
  {
    id: 'mapa-etf-indices',
    name: 'Mapa de ETFs e Índices',
    slot: 'mainHand',
    type: 'etf',
    category: 'diversificação',
    rarity: 'epico',
    setName: 'Trilha da Diversificação Global',
    requiredAmount: 900,
    power: 32,
    bonusLabel: '+10 de pontuação em diversificação',
    flavor: 'Ajuda a comparar carteira própria com referências amplas.',
    lore: 'Índices mostram como o mercado se comporta sem depender de uma empresa só.',
  },
  {
    id: 'bussola-global-bdr',
    name: 'Bússola Global de BDRs',
    slot: 'offHand',
    type: 'bdr',
    category: 'global',
    rarity: 'epico',
    setName: 'Trilha da Diversificação Global',
    requiredAmount: 1100,
    power: 34,
    bonusLabel: '+10 de pontuação em exposição global',
    flavor: 'Traz o câmbio para a conversa antes da decisão.',
    lore: 'Ativos globais podem diversificar, mas também adicionam variação cambial.',
  },
  {
    id: 'portfolio-500',
    name: 'Portfólio 500',
    slot: 'feet',
    type: 'etf',
    category: 'diversificação',
    rarity: 'artefato',
    setName: 'Trilha da Diversificação Global',
    requiredAmount: 2000,
    power: 52,
    bonusLabel: '+16 de pontuação em exposição internacional',
    flavor: 'Representa uma carteira ampla, revisada e menos dependente de palpites.',
    lore: 'Exposição ampla ajuda a reduzir concentração, mas não elimina risco.',
  },
  {
    id: 'anel-ipca-horizonte',
    name: 'Anel IPCA+ do Horizonte',
    slot: 'ring1',
    type: 'tesouro-ipca',
    category: 'longo prazo',
    rarity: 'raro',
    setName: 'Trilha Previdenciária',
    requiredAmount: 600,
    power: 23,
    bonusLabel: '+8 de pontuação contra inflação',
    flavor: 'Protege objetivos que precisam atravessar muitos anos.',
    lore: 'O IPCA+ costuma fazer sentido quando prazo e marcação a mercado são entendidos.',
  },
  {
    id: 'anel-previdencia-constante',
    name: 'Anel da Previdência Constante',
    slot: 'ring2',
    type: 'fundo-previdencia',
    category: 'longo prazo',
    rarity: 'lendario',
    setName: 'Trilha Previdenciária',
    requiredAmount: 1800,
    power: 42,
    bonusLabel: '+14 de pontuação em disciplina',
    flavor: 'Reforça que constância e taxa importam no resultado final.',
    lore: 'Previdência exige atenção a tributação, taxas, portabilidade e horizonte.',
  },
];

export const ITEM_REWARD_TRACKS = Object.keys(INVESTMENT_TYPES).reduce((tracks, typeKey) => {
  tracks[typeKey] = ITEM_LIBRARY.filter((item) => item.type === typeKey).map((item) => item.id);
  return tracks;
}, {});

ITEM_REWARD_TRACKS['aporte-manual'] = ITEM_LIBRARY.map((item) => item.id);

export const QUESTS = [
  {
    id: 'primeiro-comprovante',
    title: 'Primeiro registro financeiro',
    description: 'Valide ou registre o primeiro investimento da jornada.',
    target: 1,
    metric: 'historyCount',
    reward: 'Libera o primeiro marco educacional.',
  },
  {
    id: 'reserva-emergencia',
    title: 'Base da reserva',
    description: 'Registre pelo menos R$ 1.000,00 em renda fixa.',
    target: 1000,
    metric: 'fixedIncomeAmount',
    reward: 'Reforça a Trilha da Reserva Estável.',
  },
  {
    id: 'diversificacao-inicial',
    title: 'Diversificação consciente',
    description: 'Registre ativos de pelo menos três categorias.',
    target: 3,
    metric: 'categoryCount',
    reward: 'Mostra a amplitude do portfólio.',
  },
  {
    id: 'pontuacao-150',
    title: 'Maestria do portfólio',
    description: 'Alcance 150 pontos somando marcos e histórico.',
    target: 150,
    metric: 'power',
    reward: 'Destaca evolução consistente.',
  },
];

export const ACHIEVEMENTS = [
  {
    id: 'primeiro-registro',
    title: 'Primeiro Registro da Jornada',
    description: 'Criou o primeiro registro validado.',
    metric: 'historyCount',
    target: 1,
  },
  {
    id: 'quatro-marcos',
    title: 'Quatro Marcos, Uma Trilha',
    description: 'Equipou quatro marcos da mesma trilha financeira.',
    metric: 'largestSet',
    target: 4,
  },
  {
    id: 'cinco-rotas',
    title: 'Cinco Rotas Financeiras',
    description: 'Registrou cinco tipos de investimento diferentes.',
    metric: 'typeCount',
    target: 5,
  },
  {
    id: 'relatorio-financeiro',
    title: 'Relatório Financeiro',
    description: 'Exportou ou preparou o histórico para análise.',
    metric: 'exportCount',
    target: 1,
  },
];

export const DEFAULT_GAME_STATE = {
  meta: {
    saveVersion: SAVE_VERSION,
    characterCreated: false,
    createdAt: null,
    updatedAt: null,
    exportCount: 0,
    duplicateAttempts: 0,
  },
  player: {
    name: '',
    race: CHARACTER_RACES[0].key,
    classKey: CHARACTER_CLASSES[0].key,
  },
  wallet: {
    coins: 120,
    credits: 0,
  },
  inventory: [],
  equipment: { ...EMPTY_EQUIPMENT },
  history: [],
};

export function characterAvatarKey(player = DEFAULT_GAME_STATE.player) {
  return `${player.race || 'iniciante'}-${player.classKey || 'reserva'}`;
}
