import {
  ACHIEVEMENTS,
  DEFAULT_GAME_STATE,
  EMPTY_EQUIPMENT,
  INVESTMENT_TYPES,
  ITEM_LIBRARY,
  ITEM_REWARD_TRACKS,
  QUESTS,
  RARITY_META,
  SAVE_VERSION,
  SET_BONUSES,
  SLOT_ORDER,
} from './gameData.js';

export const ITEM_MAP = ITEM_LIBRARY.reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

export const PLAYER_NAME_MIN_LENGTH = 3;
export const PLAYER_NAME_MAX_LENGTH = 24;

export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createInitialGameState(overrides = {}) {
  return mergeGameState({
    ...clone(DEFAULT_GAME_STATE),
    ...overrides,
    meta: {
      ...DEFAULT_GAME_STATE.meta,
      ...(overrides.meta || {}),
      saveVersion: SAVE_VERSION,
    },
  });
}

export function mergeGameState(savedState = {}) {
  const safeState = savedState && typeof savedState === 'object' ? savedState : {};

  if (safeState.meta?.saveVersion && safeState.meta.saveVersion !== SAVE_VERSION) {
    return clone(DEFAULT_GAME_STATE);
  }

  const equipment = { ...EMPTY_EQUIPMENT, ...(safeState.equipment || {}) };
  for (const slot of SLOT_ORDER) {
    const itemId = equipment[slot.key];
    if (itemId && !ITEM_MAP[itemId]) {
      equipment[slot.key] = null;
    }
  }

  const inventory = Array.isArray(safeState.inventory)
    ? [...new Set(safeState.inventory.filter((itemId) => ITEM_MAP[itemId]))]
    : [];

  return {
    ...clone(DEFAULT_GAME_STATE),
    ...safeState,
    meta: {
      ...DEFAULT_GAME_STATE.meta,
      ...(safeState.meta || {}),
      saveVersion: SAVE_VERSION,
    },
    player: {
      ...DEFAULT_GAME_STATE.player,
      ...(safeState.player || {}),
    },
    wallet: {
      ...DEFAULT_GAME_STATE.wallet,
      ...(safeState.wallet || {}),
    },
    inventory,
    equipment,
    history: Array.isArray(safeState.history) ? safeState.history.filter(Boolean) : [],
  };
}

function inferDecimalSeparator(value = '') {
  const raw = String(value);
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    return lastComma > lastDot ? ',' : '.';
  }

  if (lastComma >= 0) {
    const decimals = raw.length - lastComma - 1;
    return decimals === 2 ? ',' : '.';
  }

  if (lastDot >= 0) {
    const decimals = raw.length - lastDot - 1;
    return decimals === 2 ? '.' : ',';
  }

  return ',';
}

export function parseCurrencyInput(rawValue = '') {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return 0;
  }

  const source = String(rawValue).replace(/[^\d,.-]/g, '');
  const decimalSeparator = inferDecimalSeparator(source);
  const normalized =
    decimalSeparator === ','
      ? source.replace(/\./g, '').replace(',', '.')
      : source.replace(/,/g, '');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function detectCurrency(rawText = '') {
  const source = String(rawText);
  const normalized = normalizeText(source);

  if (/us\$|\busd\b|\bdolar(?:es)?\b/i.test(source) || normalized.includes('dolar')) {
    return 'USD';
  }

  return 'BRL';
}

export function extractAmountFromText(rawText = '') {
  const source = String(rawText);
  const patterns = [
    /(?:r\$|brl)\s*([\d.,]+)/i,
    /(?:us\$|usd|\$)\s*([\d.,]+)/i,
    /(?:valor(?: total| investido| aplicado)?|total(?: da operacao)?|aplicacao|aporte|quantia|amount|gross amount|net amount)\s*[:\-]?\s*(?:r\$|brl|us\$|usd|\$)?\s*([\d.,]+)/i,
    /([\d]{1,3}(?:[.,]\d{3})*[.,]\d{2})/,
    /([\d]+[.,]\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const value = parseCurrencyInput(match[1]);
    if (value > 0) {
      return value;
    }
  }

  return 0;
}

export function classifyInvestment(rawText = '') {
  const normalized = normalizeText(rawText);
  let bestMatch = {
    typeKey: 'aporte-manual',
    confidence: 0.35,
    matchedKeywords: [],
  };

  Object.entries(INVESTMENT_TYPES).forEach(([typeKey, config]) => {
    if (!config.keywords.length) {
      return;
    }

    const matchedKeywords = config.keywords.filter((keyword) => {
      return normalized.includes(normalizeText(keyword));
    });
    const confidence = matchedKeywords.length / Math.max(1, config.keywords.length);

    if (matchedKeywords.length && 0.45 + confidence >= bestMatch.confidence) {
      bestMatch = {
        typeKey,
        confidence: Math.min(0.98, 0.45 + confidence),
        matchedKeywords,
      };
    }
  });

  return bestMatch;
}

function getBonusMultiplier(typeKey, equipment = {}) {
  const activeBonuses = getActiveSetBonuses(equipment);
  return activeBonuses.reduce((multiplier, bonus) => {
    const setConfig = SET_BONUSES[bonus.setName];
    if (setConfig?.affectedTypes?.includes(typeKey)) {
      return Math.max(multiplier, bonus.xpMultiplier || 1);
    }
    return multiplier;
  }, 1);
}

export function analyzeInvestmentPayload({
  transcript = '',
  manualAmount = '',
  equipment = {},
  exchangeRates = {},
  now = new Date(),
} = {}) {
  const text = String(transcript || '');
  const classification = classifyInvestment(text);
  const originalCurrency = detectCurrency(text || manualAmount);
  const originalAmount = extractAmountFromText(text) || parseCurrencyInput(manualAmount);
  const exchangeRate = originalCurrency === 'USD' ? Number(exchangeRates.usdBrl || exchangeRates.USD_BRL || 5) : 1;
  const amount = originalCurrency === 'USD' ? Number((originalAmount * exchangeRate).toFixed(2)) : originalAmount;
  const typeConfig = INVESTMENT_TYPES[classification.typeKey] || INVESTMENT_TYPES['aporte-manual'];
  const amountFactor = Math.max(1, Math.log10(Math.max(10, amount || 10)));
  const xpMultiplier = getBonusMultiplier(classification.typeKey, equipment);
  const xpGranted = Math.round((typeConfig.baseXp + amountFactor * 28) * xpMultiplier);
  const powerGranted = Math.round(typeConfig.power + amountFactor * 7);

  return {
    typeKey: classification.typeKey,
    typeTitle: typeConfig.title,
    category: typeConfig.category,
    amount,
    originalAmount,
    originalCurrency,
    exchangeRate,
    wasConverted: originalCurrency !== 'BRL',
    xpGranted,
    powerGranted,
    confidence: classification.confidence,
    matchedKeywords: classification.matchedKeywords,
    learning: typeConfig.learning,
    createdAt: now instanceof Date ? now.toISOString() : new Date(now).toISOString(),
  };
}

export function getOwnedItems(inventory = []) {
  return [...new Set(inventory)].map((itemId) => ITEM_MAP[itemId]).filter(Boolean);
}

export function getNextItemReward(typeKey = 'aporte-manual', inventory = []) {
  const owned = new Set(inventory);
  const track = ITEM_REWARD_TRACKS[typeKey]?.length ? ITEM_REWARD_TRACKS[typeKey] : ITEM_REWARD_TRACKS['aporte-manual'];
  return track.map((itemId) => ITEM_MAP[itemId]).find((item) => item && !owned.has(item.id)) || null;
}

export function getSetCounts(equipment = {}) {
  return Object.values(equipment).reduce((counts, itemId) => {
    const item = ITEM_MAP[itemId];
    if (!item?.setName) {
      return counts;
    }

    counts[item.setName] = (counts[item.setName] || 0) + 1;
    return counts;
  }, {});
}

export function getActiveSetBonuses(equipment = {}) {
  const counts = getSetCounts(equipment);
  return Object.entries(counts).flatMap(([setName, count]) => {
    const config = SET_BONUSES[setName];
    if (!config) {
      return [];
    }

    return config.bonuses
      .filter((bonus) => count >= bonus.pieces)
      .map((bonus) => ({
        ...bonus,
        setName,
        count,
        category: config.category,
        lore: config.lore,
      }));
  });
}

export function getUniqueEquippedItems(equipment = {}) {
  return [...new Set(Object.values(equipment).filter(Boolean))].map((itemId) => ITEM_MAP[itemId]).filter(Boolean);
}

export function calculateProfilePower(equipment = {}, history = []) {
  const equippedPower = getUniqueEquippedItems(equipment).reduce((total, item) => total + (item.power || 0), 0);
  const setPower = getActiveSetBonuses(equipment).reduce((total, bonus) => total + (bonus.power || 0), 0);
  const historyPower = history.reduce((total, entry) => total + Number(entry.powerGranted || 0), 0);
  const total = equippedPower + setPower + historyPower;

  return {
    total,
    equippedPower,
    setPower,
    historyPower,
  };
}

export function getHistorySummary(history = []) {
  const byType = {};
  const byCategory = {};

  for (const entry of history) {
    const amount = Number(entry.amount || 0);
    byType[entry.typeKey] = (byType[entry.typeKey] || 0) + amount;
    byCategory[entry.category] = (byCategory[entry.category] || 0) + amount;
  }

  return {
    totalAmount: history.reduce((total, entry) => total + Number(entry.amount || 0), 0),
    totalXp: history.reduce((total, entry) => total + Number(entry.xpGranted || 0), 0),
    count: history.length,
    typeCount: Object.keys(byType).length,
    categoryCount: Object.keys(byCategory).length,
    fixedIncomeAmount: Object.entries(byType).reduce((total, [typeKey, amount]) => {
      const category = INVESTMENT_TYPES[typeKey]?.category;
      return category === 'renda fixa' ? total + amount : total;
    }, 0),
    byType,
    byCategory,
  };
}

function metricValue(metric, context) {
  const largestSet = Math.max(0, ...Object.values(getSetCounts(context.equipment || {})));

  switch (metric) {
    case 'historyCount':
      return context.history?.length || context.summary?.count || 0;
    case 'fixedIncomeAmount':
      return context.summary?.fixedIncomeAmount || 0;
    case 'categoryCount':
      return context.summary?.categoryCount || 0;
    case 'typeCount':
      return context.summary?.typeCount || 0;
    case 'power':
      return context.power?.total || 0;
    case 'largestSet':
      return largestSet;
    case 'exportCount':
      return context.exportCount || 0;
    default:
      return 0;
  }
}

function withProgress(entry, context) {
  const value = metricValue(entry.metric, context);
  const progress = entry.target ? Math.min(1, value / entry.target) : 0;

  return {
    ...entry,
    value,
    progress,
    completed: value >= entry.target,
  };
}

export function getQuestStatuses(context = {}) {
  return QUESTS.map((quest) => withProgress(quest, context));
}

export function getAchievementStatuses(context = {}) {
  return ACHIEVEMENTS.map((achievement) => withProgress(achievement, context));
}

export function getLevelState(totalXp = 0) {
  const safeXp = Math.max(0, Number(totalXp || 0));
  const level = Math.floor(Math.sqrt(safeXp / 120)) + 1;
  const currentLevelXp = (level - 1) ** 2 * 120;
  const nextLevelXp = level ** 2 * 120;
  const progress = nextLevelXp === currentLevelXp ? 1 : (safeXp - currentLevelXp) / (nextLevelXp - currentLevelXp);

  return {
    level,
    totalXp: safeXp,
    currentLevelXp,
    nextLevelXp,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

export function getAdvisorLine({ history = [], summary = getHistorySummary(history), equipment = {} } = {}) {
  const activeBonuses = getActiveSetBonuses(equipment);

  if (!history.length) {
    return 'Comece por um registro simples. O primeiro comprovante válido já mostra como a jornada transforma dados em aprendizado.';
  }

  if (summary.fixedIncomeAmount < 1000) {
    return 'Sua base de reserva ainda pode crescer. Tesouro Selic, CDB ou LCI/LCA são próximos passos coerentes.';
  }

  if (summary.categoryCount < 3) {
    return 'Você já tem consistência. O próximo passo é comparar categorias para reduzir concentração.';
  }

  if (!activeBonuses.length) {
    return 'Equipe marcos da mesma trilha para ativar bônus educacionais e enxergar melhor sua estratégia.';
  }

  return 'A jornada está bem distribuída. Continue revisando risco, prazo, liquidez e objetivo antes de novos aportes.';
}

export function formatCurrency(value = 0, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatCompact(value = 0) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

export function shortHash(value = '') {
  let hash = 0;
  const source = String(value);
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 10);
}

export function buildCsv(history = []) {
  const header = [
    'id',
    'data',
    'tipo',
    'categoria',
    'valor_brl',
    'valor_original',
    'moeda_original',
    'cotacao',
    'xp',
    'pontuacao',
    'hash',
    'arquivo',
  ];
  const rows = history.map((entry) => [
    entry.id,
    entry.createdAt,
    entry.typeTitle,
    entry.category,
    String(entry.amount || 0),
    String(entry.originalAmount || entry.amount || 0),
    entry.originalCurrency || 'BRL',
    String(entry.exchangeRate || 1),
    String(entry.xpGranted || 0),
    String(entry.powerGranted || 0),
    entry.hash || '',
    entry.proofName || '',
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(';'),
    )
    .join('\n');
}

export function equipFirstCompatibleItem(state, itemId) {
  const item = ITEM_MAP[itemId];
  if (!item) {
    return state;
  }

  const slot = SLOT_ORDER.find((entry) => entry.key === item.slot || entry.accepts?.includes(item.slot));
  if (!slot) {
    return state;
  }

  return {
    ...state,
    equipment: {
      ...state.equipment,
      [slot.key]: item.id,
    },
  };
}

export function getRarityMeta(rarity = 'comum') {
  return RARITY_META[rarity] || RARITY_META.comum;
}
