export const APP_NAME = 'Finance Quest';
export const SAVE_VERSION = 4;

export const SLOT_ORDER = [
  { key: 'head', label: 'Elmo', description: 'Planejamento' },
  { key: 'shoulders', label: 'Ombreiras', description: 'Liquidez' },
  { key: 'chest', label: 'Armadura', description: 'Crédito' },
  { key: 'hands', label: 'Luvas', description: 'Registro' },
  { key: 'neck', label: 'Amuleto', description: 'Renda e mercado' },
  { key: 'mainHand', label: 'Lâmina', description: 'Risco e aporte' },
  { key: 'offHand', label: 'Grimório', description: 'Estudo' },
  { key: 'feet', label: 'Botas', description: 'Diversificação' },
  { key: 'ring1', label: 'Anel I', accepts: ['ring'], description: 'Hábito' },
  { key: 'ring2', label: 'Anel II', accepts: ['ring'], description: 'Revisão' },
];

export const EMPTY_EQUIPMENT = SLOT_ORDER.reduce((equipment, slot) => {
  equipment[slot.key] = null;
  return equipment;
}, {});

export const RARITY_META = {
  comum: {
    label: 'Comum',
    color: '#9FB3C8',
    aura: '#6B7F95',
    minAmount: 0,
    baseWeight: 58,
    xpMultiplier: 1,
    itemDropMultiplier: 1,
  },
  raro: {
    label: 'Raro',
    color: '#62D6A6',
    aura: '#2DD4BF',
    minAmount: 350,
    baseWeight: 28,
    xpMultiplier: 1.04,
    itemDropMultiplier: 1.03,
  },
  epico: {
    label: 'Épico',
    color: '#5AC8FA',
    aura: '#38BDF8',
    minAmount: 900,
    baseWeight: 12,
    xpMultiplier: 1.08,
    itemDropMultiplier: 1.06,
  },
  lendario: {
    label: 'Lendário',
    color: '#F6C453',
    aura: '#F59E0B',
    minAmount: 1800,
    baseWeight: 4,
    xpMultiplier: 1.14,
    itemDropMultiplier: 1.1,
  },
  artefato: {
    label: 'Artefato',
    color: '#FF7A6B',
    aura: '#F43F5E',
    minAmount: 4000,
    baseWeight: 1,
    xpMultiplier: 1.22,
    itemDropMultiplier: 1.16,
  },
};

export const CHARACTER_RACES = [
  {
    key: 'guardiao',
    label: 'Perfil Conservador',
    bonus: 'Prioriza segurança, liquidez e previsibilidade antes de buscar retorno maior.',
  },
  {
    key: 'arcanista',
    label: 'Perfil Analítico',
    bonus: 'Compara dados, taxas, prazos e diversificação antes de registrar um aporte.',
  },
  {
    key: 'mercador',
    label: 'Perfil Estratégico',
    bonus: 'Organiza objetivos, custos e riscos para decidir com mais clareza.',
  },
];

export const CHARACTER_CLASSES = [
  {
    key: 'renda-fixa',
    label: 'Reserva e Renda Fixa',
    bonus: 'Começa pela formação de reserva e pelo entendimento de crédito, liquidez e juros.',
  },
  {
    key: 'diversificacao',
    label: 'Diversificação',
    bonus: 'Busca classes diferentes sem concentrar tudo no mesmo tipo de risco.',
  },
  {
    key: 'longo-prazo',
    label: 'Longo Prazo',
    bonus: 'Usa tempo, juros compostos e revisão periódica para objetivos maiores.',
  },
];

export const INVESTMENT_CATEGORIES = [
  { key: 'renda-fixa', label: 'Renda fixa', icon: 'shield-half-full' },
  { key: 'renda-variavel', label: 'Renda variável', icon: 'chart-line' },
  { key: 'fundos', label: 'Fundos e ETFs', icon: 'chart-donut' },
  { key: 'global', label: 'Global', icon: 'earth' },
  { key: 'longo-prazo', label: 'Longo prazo', icon: 'timer-sand-complete' },
];

export const INVESTMENT_TYPES = {
  'tesouro-selic': {
    title: 'Tesouro Selic',
    category: 'renda-fixa',
    keywords: ['tesouro selic', 'selic', 'tesouro direto', 'título público', 'titulo publico'],
    baseXp: 90,
    power: 18,
    icon: 'shield-check',
    learning:
      'Boa referência para reserva de emergência por combinar liquidez, baixo risco e acompanhamento simples.',
  },
  'tesouro-ipca': {
    title: 'Tesouro IPCA+',
    category: 'renda-fixa',
    keywords: ['tesouro ipca', 'ipca+', 'ntn-b', 'inflação', 'inflacao'],
    baseXp: 110,
    power: 22,
    icon: 'chart-bell-curve-cumulative',
    learning:
      'Ajuda a pensar em proteção contra inflação quando o objetivo tem prazo mais longo.',
  },
  cdb: {
    title: 'CDB',
    category: 'renda-fixa',
    keywords: ['cdb', 'certificado de depósito', 'certificado de deposito', 'banco emissor'],
    baseXp: 95,
    power: 19,
    icon: 'bank-check',
    learning:
      'Permite comparar rentabilidade, prazo, liquidez, emissor e cobertura do FGC.',
  },
  'lci-lca': {
    title: 'LCI/LCA',
    category: 'renda-fixa',
    keywords: ['lci', 'lca', 'agronegócio', 'agronegocio', 'imobiliário', 'imobiliario'],
    baseXp: 100,
    power: 20,
    icon: 'leaf-circle',
    learning:
      'Reforça a análise de prazo, isenção de IR, liquidez e garantia para pessoa física.',
  },
  fii: {
    title: 'Fundo Imobiliário',
    category: 'renda-variavel',
    keywords: ['fii', 'fundo imobiliário', 'fundo imobiliario', 'hglg11', 'mxrf11', 'dividend yield'],
    baseXp: 120,
    power: 25,
    icon: 'home-city-outline',
    learning:
      'Estimula leitura de vacância, contratos, recorrência de rendimentos e diversificação.',
  },
  acao: {
    title: 'Ação',
    category: 'renda-variavel',
    keywords: ['ação', 'acao', 'ações', 'acoes', 'b3', 'ticker', 'petrobras', 'vale3', 'itub4'],
    baseXp: 130,
    power: 28,
    icon: 'finance',
    learning:
      'Exige leitura de negócio, risco, governança, preço e horizonte de investimento.',
  },
  etf: {
    title: 'ETF',
    category: 'fundos',
    keywords: ['etf', 'ivvb11', 'bova11', 'smal11', 'índice', 'indice', 's&p', 'sp500'],
    baseXp: 125,
    power: 27,
    icon: 'chart-box-outline',
    learning:
      'Facilita exposição diversificada e comparação com índices de referência.',
  },
  bdr: {
    title: 'BDR',
    category: 'global',
    keywords: ['bdr', 'recibo', 'apple', 'google', 'nvidia', 'mercado global'],
    baseXp: 135,
    power: 29,
    icon: 'earth-arrow-right',
    learning:
      'Conecta o usuário a empresas globais e à variação cambial com responsabilidade.',
  },
  'fundo-previdencia': {
    title: 'Fundo de Previdência',
    category: 'longo-prazo',
    keywords: ['previdência', 'previdencia', 'pgbl', 'vgbl', 'aposentadoria'],
    baseXp: 115,
    power: 24,
    icon: 'clock-star-four-points-outline',
    learning:
      'Ajuda a organizar horizonte, tributação, taxa de administração e disciplina.',
  },
};

export const SOURCE_REFERENCES = [
  {
    label: 'CVM / Portal do Investidor',
    focus: 'Riscos, fundos imobiliários, ETFs e tomada de decisão consciente.',
    url: 'https://www.gov.br/investidor/pt-br',
  },
  {
    label: 'ANBIMA Como Investir',
    focus: 'Conceitos, fundos, ETFs, risco e custos em linguagem educativa.',
    url: 'https://comoinvestir.anbima.com.br/',
  },
  {
    label: 'Tesouro Direto',
    focus: 'Tesouro Selic, Tesouro IPCA+, resgate antecipado e marcação a mercado.',
    url: 'https://www.tesourodireto.com.br/',
  },
  {
    label: 'FGC',
    focus: 'Cobertura de CDB, LCI/LCA e limites de garantia.',
    url: 'https://www.fgc.org.br/sobre-garantia-fgc',
  },
  {
    label: 'Banco Central',
    focus: 'Educação financeira, risco de crédito e cuidado com promessas de retorno.',
    url: 'https://www.bcb.gov.br/cidadaniafinanceira',
  },
];

export const INVESTMENT_GUIDE = {
  'tesouro-selic': {
    riskLevel: 'Baixo',
    riskTone: 'low',
    objective: 'Reserva de emergência e dinheiro com prazo curto.',
    liquidity: 'Alta no Tesouro Direto, com recompra em dias úteis pelo Tesouro Nacional.',
    guarantee: 'Título público federal; não usa FGC.',
    costs: 'Pode ter IR regressivo e taxa de custódia conforme regras do Tesouro.',
    summary:
      'É a opção mais simples para começar em títulos públicos e costuma oscilar menos em caso de venda antecipada.',
    risks: [
      'Ainda existe risco soberano, mesmo sendo baixo no contexto brasileiro.',
      'A rentabilidade acompanha juros básicos e pode não ser a melhor para objetivos longos.',
      'Impostos e taxas reduzem o rendimento líquido.',
    ],
    checklist: ['Comparar com CDI e taxa líquida', 'Confirmar prazo de resgate', 'Usar para reserva antes de buscar risco maior'],
  },
  'tesouro-ipca': {
    riskLevel: 'Médio',
    riskTone: 'medium',
    objective: 'Objetivos de médio e longo prazo com proteção contra inflação.',
    liquidity: 'Tem recompra pelo Tesouro, mas o preço pode variar antes do vencimento.',
    guarantee: 'Título público federal; não usa FGC.',
    costs: 'Pode ter IR regressivo e taxa de custódia conforme regras do Tesouro.',
    summary:
      'Combina IPCA com uma taxa fixa. Faz mais sentido quando o prazo do título conversa com o objetivo.',
    risks: [
      'Marcação a mercado pode gerar perda se vender antes do vencimento.',
      'Quanto maior o prazo, maior tende a ser a sensibilidade às taxas de juros.',
      'Não é ideal para reserva de emergência.',
    ],
    checklist: ['Definir data do objetivo', 'Evitar venda antecipada por impulso', 'Entender marcação a mercado'],
  },
  cdb: {
    riskLevel: 'Baixo a médio',
    riskTone: 'medium',
    objective: 'Renda fixa bancária para reserva, metas ou prazos definidos.',
    liquidity: 'Varia por produto: diária, no vencimento ou com carência.',
    guarantee: 'Pode ter cobertura do FGC dentro dos limites vigentes.',
    costs: 'Geralmente tem IR regressivo; comparar rentabilidade líquida.',
    summary:
      'É um empréstimo ao banco emissor. A taxa maior pode compensar prazo, liquidez menor ou risco do emissor.',
    risks: [
      'Risco de crédito do banco emissor.',
      'Pode não permitir resgate antes do vencimento.',
      'Rentabilidade bruta pode parecer melhor do que a líquida.',
    ],
    checklist: ['Ver emissor e rating quando houver', 'Conferir liquidez', 'Calcular rendimento líquido'],
  },
  'lci-lca': {
    riskLevel: 'Baixo a médio',
    riskTone: 'medium',
    objective: 'Renda fixa isenta de IR para pessoa física, com foco em prazos definidos.',
    liquidity: 'Costuma ter carência e pode não servir para dinheiro de emergência.',
    guarantee: 'Pode ter cobertura do FGC dentro dos limites vigentes.',
    costs: 'Isenção de IR para pessoa física, mas a taxa deve ser comparada com CDB líquido.',
    summary:
      'LCI e LCA são letras de crédito ligadas ao mercado imobiliário ou ao agronegócio.',
    risks: [
      'Risco de crédito da instituição emissora.',
      'Carência pode reduzir flexibilidade.',
      'Taxa menor pode não compensar mesmo com isenção de IR.',
    ],
    checklist: ['Comparar com CDB líquido', 'Ver carência', 'Conferir se o emissor é coberto pelo FGC'],
  },
  fii: {
    riskLevel: 'Médio a alto',
    riskTone: 'high',
    objective: 'Exposição ao mercado imobiliário e possível renda recorrente.',
    liquidity: 'Negociado em bolsa; liquidez varia por fundo.',
    guarantee: 'Não tem FGC.',
    costs: 'Pode haver taxas do fundo, custos de corretagem e tributação específica.',
    summary:
      'FIIs reúnem investidores para aplicar em imóveis, recebíveis ou estratégias imobiliárias.',
    risks: [
      'Vacância, inadimplência e revisão de contratos podem reduzir rendimentos.',
      'Cotas oscilam em bolsa e sofrem com juros e percepção de risco.',
      'Liquidez pode ser baixa em fundos menores.',
    ],
    checklist: ['Ver relatório gerencial', 'Checar vacância e concentração', 'Entender fonte dos rendimentos'],
  },
  acao: {
    riskLevel: 'Alto',
    riskTone: 'high',
    objective: 'Participar do crescimento de empresas no longo prazo.',
    liquidity: 'Negociada em bolsa; varia conforme a empresa.',
    guarantee: 'Não tem FGC.',
    costs: 'Pode haver corretagem, emolumentos e IR conforme operação.',
    summary:
      'Ação representa uma fração de uma empresa. O retorno depende de resultado, preço e expectativa do mercado.',
    risks: [
      'Preço pode oscilar muito no curto prazo.',
      'Empresa pode piorar resultados, governança ou endividamento.',
      'Concentrar em poucas ações aumenta o risco específico.',
    ],
    checklist: ['Ler fundamentos básicos', 'Diversificar setores', 'Investir com horizonte maior'],
  },
  etf: {
    riskLevel: 'Médio a alto',
    riskTone: 'high',
    objective: 'Diversificar seguindo um índice de mercado.',
    liquidity: 'Negociado em bolsa; depende do ETF e do formador de mercado.',
    guarantee: 'Não tem FGC.',
    costs: 'Possui taxa de administração e tributação própria.',
    summary:
      'ETF é um fundo negociado em bolsa que busca acompanhar um índice, como ações, renda fixa ou exterior.',
    risks: [
      'Oscila conforme os ativos do índice.',
      'ETFs internacionais podem ter risco cambial.',
      'Nem todo índice é bem diversificado.',
    ],
    checklist: ['Entender o índice', 'Ver taxa e liquidez', 'Checar exposição cambial ou setorial'],
  },
  bdr: {
    riskLevel: 'Alto',
    riskTone: 'high',
    objective: 'Ter exposição a empresas ou ativos negociados no exterior.',
    liquidity: 'Negociado na B3; liquidez varia por recibo.',
    guarantee: 'Não tem FGC.',
    costs: 'Pode haver custos de negociação, tributação e impacto cambial.',
    summary:
      'BDR é um recibo negociado no Brasil que representa ativo emitido fora do país.',
    risks: [
      'Variação cambial pode afetar o resultado em reais.',
      'O ativo original pode oscilar por fatores internacionais.',
      'Liquidez e informação podem ser diferentes das ações brasileiras.',
    ],
    checklist: ['Entender empresa/índice de origem', 'Considerar câmbio', 'Evitar concentração geográfica'],
  },
  'fundo-previdencia': {
    riskLevel: 'Médio',
    riskTone: 'medium',
    objective: 'Planejamento de aposentadoria e objetivos longos.',
    liquidity: 'Regras de resgate variam por fundo e plano.',
    guarantee: 'Não tem FGC; depende da carteira e da seguradora/gestora.',
    costs: 'Avaliar taxa de administração, tributação, tabela PGBL/VGBL e portabilidade.',
    summary:
      'Previdência combina horizonte longo, benefício tributário potencial e gestão profissional.',
    risks: [
      'Taxas altas podem reduzir muito o retorno no longo prazo.',
      'Escolha errada de tributação pode prejudicar o objetivo.',
      'Carteira do fundo pode ter risco de mercado.',
    ],
    checklist: ['Comparar taxa de administração', 'Escolher PGBL ou VGBL com critério', 'Revisar portabilidade'],
  },
};

export const SET_BONUSES = {
  'Ordem da Reserva Estável': {
    category: 'renda-fixa',
    affectedTypes: ['tesouro-selic', 'tesouro-ipca', 'cdb', 'lci-lca'],
    lore: 'Arsenal defensivo para reserva, liquidez e renda fixa consciente.',
    bonuses: [
      { pieces: 2, label: '+10% XP em renda fixa', xpMultiplier: 1.1, itemDropMultiplier: 1.03, power: 12 },
      { pieces: 4, label: '+18% XP e +8% chance de item', xpMultiplier: 1.18, itemDropMultiplier: 1.08, power: 18 },
    ],
  },
  'Conclave da Diversificação': {
    category: 'fundos',
    affectedTypes: ['etf', 'bdr', 'acao', 'fii'],
    lore: 'Conjunto para comparar riscos, setores e moedas diferentes.',
    bonuses: [
      { pieces: 2, label: '+8% XP em ativos diversificados', xpMultiplier: 1.08, itemDropMultiplier: 1.04, power: 10 },
      { pieces: 4, label: '+16% XP e +10% chance de item', xpMultiplier: 1.16, itemDropMultiplier: 1.1, power: 16 },
    ],
  },
  'Círculo do Longo Prazo': {
    category: 'longo-prazo',
    affectedTypes: ['fundo-previdencia', 'tesouro-ipca', 'etf'],
    lore: 'Conjunto de constância para objetivos que dependem de tempo.',
    bonuses: [
      { pieces: 2, label: '+9% XP em longo prazo', xpMultiplier: 1.09, itemDropMultiplier: 1.03, power: 11 },
      { pieces: 4, label: '+15% XP e +20 de poder', xpMultiplier: 1.15, itemDropMultiplier: 1.08, power: 20 },
    ],
  },
};

export const ITEM_LIBRARY = [
  {
    id: 'elmo-reserva-inicial',
    name: 'Elmo da Reserva Inicial',
    slot: 'head',
    type: 'tesouro-selic',
    category: 'renda-fixa',
    rarity: 'comum',
    setName: 'Ordem da Reserva Estável',
    requiredAmount: 100,
    power: 14,
    xpMultiplier: 1.02,
    itemDropMultiplier: 1,
    icon: 'shield-sun-outline',
    bonusLabel: '+2% XP em registros',
    flavor: 'Protege contra decisões impulsivas antes do primeiro aporte.',
    lore: 'Reserva de emergência é a defesa básica contra vender ativos no pior momento.',
  },
  {
    id: 'ombreiras-liquidez-diaria',
    name: 'Ombreiras da Liquidez Diária',
    slot: 'shoulders',
    type: 'tesouro-selic',
    category: 'renda-fixa',
    rarity: 'raro',
    setName: 'Ordem da Reserva Estável',
    requiredAmount: 450,
    power: 22,
    xpMultiplier: 1.04,
    itemDropMultiplier: 1.02,
    icon: 'shield-half-full',
    bonusLabel: '+4% XP e +2% item',
    flavor: 'Mantém recursos acessíveis quando a vida exige resposta rápida.',
    lore: 'Liquidez evita vender investimentos ruins no pior momento.',
  },
  {
    id: 'armadura-cdb-comparado',
    name: 'Armadura do CDB Comparado',
    slot: 'chest',
    type: 'cdb',
    category: 'renda-fixa',
    rarity: 'epico',
    setName: 'Ordem da Reserva Estável',
    requiredAmount: 900,
    power: 32,
    xpMultiplier: 1.08,
    itemDropMultiplier: 1.04,
    icon: 'bank-check',
    bonusLabel: '+8% XP e +4% item',
    flavor: 'Compara taxa, prazo, liquidez e proteção do FGC.',
    lore: 'Nem todo CDB serve ao mesmo objetivo; contexto importa.',
  },
  {
    id: 'luvas-lci-lca-isenta',
    name: 'Luvas da Isenção LCI/LCA',
    slot: 'hands',
    type: 'lci-lca',
    category: 'renda-fixa',
    rarity: 'lendario',
    setName: 'Ordem da Reserva Estável',
    requiredAmount: 1800,
    power: 42,
    xpMultiplier: 1.14,
    itemDropMultiplier: 1.08,
    icon: 'leaf-circle',
    bonusLabel: '+14% XP e +8% item',
    flavor: 'Transforma comparação líquida em disciplina de análise.',
    lore: 'Isenção de IR não dispensa análise de prazo, risco e liquidez.',
  },
  {
    id: 'tomo-ipca-horizonte',
    name: 'Grimório IPCA+ do Horizonte',
    slot: 'offHand',
    type: 'tesouro-ipca',
    category: 'renda-fixa',
    rarity: 'artefato',
    setName: 'Círculo do Longo Prazo',
    requiredAmount: 4200,
    power: 58,
    xpMultiplier: 1.2,
    itemDropMultiplier: 1.12,
    icon: 'book-lock-open-outline',
    bonusLabel: '+20% XP e +12% item',
    flavor: 'Brilha quando o objetivo precisa atravessar muitos anos.',
    lore: 'O IPCA+ pede entendimento de prazo e marcação a mercado.',
  },
  {
    id: 'amuleto-fiis-recorrencia',
    name: 'Amuleto dos FIIs Recorrentes',
    slot: 'neck',
    type: 'fii',
    category: 'renda-variavel',
    rarity: 'raro',
    setName: 'Conclave da Diversificação',
    requiredAmount: 500,
    power: 24,
    xpMultiplier: 1.04,
    itemDropMultiplier: 1.03,
    icon: 'home-city-outline',
    bonusLabel: '+4% XP e +3% item',
    flavor: 'Revela vacância, contratos e recorrência de rendimentos.',
    lore: 'FIIs combinam renda, risco de mercado e risco imobiliário.',
  },
  {
    id: 'lamina-acao-fundamentalista',
    name: 'Lâmina da Ação Fundamentalista',
    slot: 'mainHand',
    type: 'acao',
    category: 'renda-variavel',
    rarity: 'epico',
    setName: 'Conclave da Diversificação',
    requiredAmount: 1000,
    power: 36,
    xpMultiplier: 1.09,
    itemDropMultiplier: 1.05,
    icon: 'chart-line',
    bonusLabel: '+9% XP e +5% item',
    flavor: 'Corta ruído de curto prazo para enxergar valor e risco.',
    lore: 'Ações exigem leitura de negócio, preço, governança e horizonte.',
  },
  {
    id: 'botas-etf-indices',
    name: 'Botas dos Índices Amplos',
    slot: 'feet',
    type: 'etf',
    category: 'fundos',
    rarity: 'epico',
    setName: 'Conclave da Diversificação',
    requiredAmount: 950,
    power: 34,
    xpMultiplier: 1.08,
    itemDropMultiplier: 1.05,
    icon: 'chart-box-outline',
    bonusLabel: '+8% XP e +5% item',
    flavor: 'Atravessam mercados inteiros sem depender de um único ativo.',
    lore: 'Índices ajudam a comparar carteira própria com referências amplas.',
  },
  {
    id: 'bussola-bdr-global',
    name: 'Bússola Global dos BDRs',
    slot: 'offHand',
    type: 'bdr',
    category: 'global',
    rarity: 'lendario',
    setName: 'Conclave da Diversificação',
    requiredAmount: 2200,
    power: 46,
    xpMultiplier: 1.15,
    itemDropMultiplier: 1.09,
    icon: 'earth-arrow-right',
    bonusLabel: '+15% XP e +9% item',
    flavor: 'Aponta para empresas globais sem ignorar o câmbio.',
    lore: 'Ativos globais diversificam, mas adicionam variação cambial.',
  },
  {
    id: 'anel-previdencia-constante',
    name: 'Anel da Previdência Constante',
    slot: 'ring',
    type: 'fundo-previdencia',
    category: 'longo-prazo',
    rarity: 'lendario',
    setName: 'Círculo do Longo Prazo',
    requiredAmount: 2000,
    power: 44,
    xpMultiplier: 1.14,
    itemDropMultiplier: 1.08,
    icon: 'ring',
    bonusLabel: '+14% XP e +8% item',
    flavor: 'Aumenta de poder quando o usuário mantém constância.',
    lore: 'Previdência exige atenção a tributação, taxas, portabilidade e horizonte.',
  },
  {
    id: 'anel-juros-compostos',
    name: 'Anel dos Juros Compostos',
    slot: 'ring',
    type: 'fundo-previdencia',
    category: 'longo-prazo',
    rarity: 'artefato',
    setName: 'Círculo do Longo Prazo',
    requiredAmount: 5000,
    power: 62,
    xpMultiplier: 1.24,
    itemDropMultiplier: 1.14,
    icon: 'creation',
    bonusLabel: '+24% XP e +14% item',
    flavor: 'Quanto mais tempo equipado, mais forte a disciplina parece.',
    lore: 'Tempo e consistência são grandes aliados dos juros compostos.',
  },
  {
    id: 'capa-aporte-manual',
    name: 'Capa do Registro Manual',
    slot: 'shoulders',
    type: 'aporte-manual',
    category: 'fundos',
    rarity: 'comum',
    setName: 'Conclave da Diversificação',
    requiredAmount: 50,
    power: 12,
    xpMultiplier: 1.01,
    itemDropMultiplier: 1,
    icon: 'file-document-edit-outline',
    bonusLabel: '+1% XP em registros',
    flavor: 'Mesmo sem comprovante perfeito, o registro continua.',
    lore: 'Registrar com consistência é melhor do que abandonar o acompanhamento.',
  },
];

export const ITEM_REWARD_TRACKS = Object.keys(INVESTMENT_TYPES).reduce((tracks, typeKey) => {
  tracks[typeKey] = ITEM_LIBRARY.filter((item) => item.type === typeKey || item.type === 'aporte-manual').map((item) => item.id);
  return tracks;
}, {});

export const QUESTS = [
  {
    id: 'primeiro-aporte',
    title: 'Primeiro Registro',
    description: 'Registre o primeiro investimento e receba um item educativo inicial.',
    target: 1,
    metric: 'historyCount',
    reward: 'Libera o inventário e o primeiro conceito.',
  },
  {
    id: 'reserva-emergencia',
    title: 'Reserva em Formação',
    description: 'Registre pelo menos R$ 1.000,00 em renda fixa.',
    target: 1000,
    metric: 'fixedIncomeAmount',
    reward: 'Aumenta domínio da Ordem da Reserva Estável.',
  },
  {
    id: 'diversificacao-inicial',
    title: 'Diversificação Inicial',
    description: 'Registre ativos de pelo menos três categorias.',
    target: 3,
    metric: 'categoryCount',
    reward: 'Mostra a amplitude da carteira.',
  },
  {
    id: 'poder-250',
    title: 'Portfólio em Evolução',
    description: 'Alcance 250 de poder somando equipamentos e histórico.',
    target: 250,
    metric: 'power',
    reward: 'Desbloqueia status de aprendizagem avançada.',
  },
];

export const ACHIEVEMENTS = [
  {
    id: 'primeiro-drop',
    title: 'Primeiro Item Educativo',
    description: 'Recebeu o primeiro item de aprendizagem.',
    metric: 'inventoryCount',
    target: 1,
  },
  {
    id: 'quatro-pecas',
    title: 'Quatro Conceitos Conectados',
    description: 'Equipou quatro itens da mesma trilha.',
    metric: 'largestSet',
    target: 4,
  },
  {
    id: 'cinco-rotas',
    title: 'Cinco Classes Estudadas',
    description: 'Registrou cinco tipos de investimento diferentes.',
    metric: 'typeCount',
    target: 5,
  },
  {
    id: 'artefato-lendario',
    title: 'Artefato de Aprendizagem',
    description: 'Conquistou pelo menos um item de raridade artefato.',
    metric: 'artifactCount',
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
    duplicateDrops: 0,
  },
  player: {
    name: '',
    race: CHARACTER_RACES[0].key,
    classKey: CHARACTER_CLASSES[0].key,
  },
  wallet: {
    coins: 120,
    crystals: 0,
  },
  inventory: [],
  equipment: { ...EMPTY_EQUIPMENT },
  history: [],
};

export function characterAvatarKey(player = DEFAULT_GAME_STATE.player) {
  return `${player.race || 'guardiao'}-${player.classKey || 'renda-fixa'}`;
}
