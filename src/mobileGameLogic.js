import {
  ACHIEVEMENTS,
  DEFAULT_GAME_STATE,
  EMPTY_EQUIPMENT,
  INVESTMENT_CATEGORIES,
  INVESTMENT_TYPES,
  ITEM_LIBRARY,
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
  const incomingInventory = Array.isArray(safeState.inventory) ? safeState.inventory : [];
  const equipment = { ...EMPTY_EQUIPMENT, ...(safeState.equipment || {}) };
  const inventory = [...new Set(incomingInventory.filter((itemId) => ITEM_MAP[itemId]))];

  for (const slot of SLOT_ORDER) {
    const itemId = equipment[slot.key];
    if (itemId && (!ITEM_MAP[itemId] || !inventory.includes(itemId))) {
      equipment[slot.key] = null;
    }
  }

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

function detectCurrency(rawText = '', fallback = 'BRL') {
  const source = String(rawText);
  const normalized = normalizeText(source);

  if (/us\$|\busd\b|\bdolar(?:es)?\b/i.test(source) || normalized.includes('dolar')) {
    return 'USD';
  }

  return fallback || 'BRL';
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

export function getInvestmentCategories() {
  return INVESTMENT_CATEGORIES;
}

export function getInvestmentTypesByCategory(categoryKey) {
  return Object.entries(INVESTMENT_TYPES)
    .filter(([, config]) => !categoryKey || config.category === categoryKey)
    .map(([key, config]) => ({ key, ...config }));
}

export function classifyInvestment(rawText = '', explicitTypeKey = '') {
  if (explicitTypeKey && INVESTMENT_TYPES[explicitTypeKey]) {
    return {
      typeKey: explicitTypeKey,
      confidence: 1,
      matchedKeywords: ['seleção manual'],
    };
  }

  const normalized = normalizeText(rawText);
  let bestMatch = {
    typeKey: 'tesouro-selic',
    confidence: 0.2,
    matchedKeywords: [],
  };

  Object.entries(INVESTMENT_TYPES).forEach(([typeKey, config]) => {
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

export function analyzeOcrText(rawText = '') {
  const classification = classifyInvestment(rawText);
  const amount = extractAmountFromText(rawText);
  const currency = detectCurrency(rawText);
  const typeConfig = INVESTMENT_TYPES[classification.typeKey];

  return {
    amount,
    currency,
    typeKey: classification.typeKey,
    category: typeConfig.category,
    confidence: amount > 0 ? classification.confidence : Math.min(0.35, classification.confidence),
    matchedKeywords: classification.matchedKeywords,
    summary:
      amount > 0
        ? `OCR identificou ${typeConfig.title} no valor de ${formatCurrency(amount, currency)}.`
        : 'OCR não encontrou valor confiável. Confira o comprovante ou digite a quantia manualmente.',
  };
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

export function getEquipmentMultipliers(equipment = {}) {
  const equippedItems = getUniqueEquippedItems(equipment);
  const itemXp = equippedItems.reduce((multiplier, item) => multiplier * Number(item.xpMultiplier || 1), 1);
  const itemDrop = equippedItems.reduce((multiplier, item) => multiplier * Number(item.itemDropMultiplier || 1), 1);
  const setBonuses = getActiveSetBonuses(equipment);
  const setXp = setBonuses.reduce((multiplier, bonus) => multiplier * Number(bonus.xpMultiplier || 1), 1);
  const setDrop = setBonuses.reduce((multiplier, bonus) => multiplier * Number(bonus.itemDropMultiplier || 1), 1);

  return {
    xpMultiplier: Number((itemXp * setXp).toFixed(3)),
    itemDropMultiplier: Number((itemDrop * setDrop).toFixed(3)),
    equippedItems,
    setBonuses,
  };
}

function seededRandom(seed) {
  let value = 0;
  const source = String(seed);
  for (let index = 0; index < source.length; index += 1) {
    value = (value * 31 + source.charCodeAt(index)) >>> 0;
  }
  value = (value + 0x6d2b79f5) | 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function calculateDropChances(amount = 0, itemDropMultiplier = 1) {
  const safeAmount = Math.max(0, Number(amount || 0));
  const amountBoost = Math.min(5, Math.log10(Math.max(10, safeAmount)) - 1);
  const entries = Object.entries(RARITY_META).map(([rarity, meta]) => {
    const unlocked = safeAmount >= meta.minAmount;
    const rarityBoost =
      rarity === 'comum'
        ? Math.max(10, meta.baseWeight - amountBoost * 7)
        : meta.baseWeight * (1 + amountBoost * (rarity === 'artefato' ? 0.9 : 0.55));
    const weight = unlocked ? Math.max(0.5, rarityBoost * itemDropMultiplier) : 0;
    return { rarity, weight };
  });
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0) || 1;

  return entries.map((entry) => ({
    rarity: entry.rarity,
    chance: entry.weight / total,
  }));
}

function chooseRarity(amount, itemDropMultiplier, seed) {
  const chances = calculateDropChances(amount, itemDropMultiplier);
  const roll = seededRandom(seed);
  let cursor = 0;

  for (const entry of chances) {
    cursor += entry.chance;
    if (roll <= cursor) {
      return entry.rarity;
    }
  }

  return 'comum';
}

function candidateScore(item, typeKey, categoryKey, amount) {
  let score = 0;
  if (item.type === typeKey) score += 8;
  if (item.category === categoryKey) score += 4;
  if (amount >= item.requiredAmount) score += 4;
  score += item.power / 20;
  return score;
}

export function rollItemDrops({
  typeKey,
  amount,
  inventory = [],
  equipment = {},
  seed = Date.now(),
} = {}) {
  const typeConfig = INVESTMENT_TYPES[typeKey] || INVESTMENT_TYPES['tesouro-selic'];
  const { itemDropMultiplier } = getEquipmentMultipliers(equipment);
  const safeAmount = Math.max(0, Number(amount || 0));
  const baseDropCount = 1 + (safeAmount >= 1500 ? 1 : 0) + (safeAmount >= 5000 ? 1 : 0);
  const bonusDrop = seededRandom(`${seed}-bonus`) < Math.min(0.45, (itemDropMultiplier - 1) * 0.7) ? 1 : 0;
  const dropCount = Math.min(3, baseDropCount + bonusDrop);
  const owned = new Set(inventory);
  const drops = [];
  let duplicateCount = 0;

  for (let index = 0; index < dropCount; index += 1) {
    const rarity = chooseRarity(safeAmount, itemDropMultiplier, `${seed}-${index}`);
    const candidates = ITEM_LIBRARY
      .filter((item) => item.rarity === rarity)
      .filter((item) => safeAmount >= item.requiredAmount * 0.7)
      .sort((a, b) => candidateScore(b, typeKey, typeConfig.category, safeAmount) - candidateScore(a, typeKey, typeConfig.category, safeAmount));
    const fallbackCandidates = ITEM_LIBRARY
      .filter((item) => safeAmount >= item.requiredAmount * 0.7)
      .sort((a, b) => candidateScore(b, typeKey, typeConfig.category, safeAmount) - candidateScore(a, typeKey, typeConfig.category, safeAmount));
    const pool = candidates.length ? candidates : fallbackCandidates;

    if (!pool.length) {
      continue;
    }

    const pickIndex = Math.floor(seededRandom(`${seed}-pick-${index}`) * pool.length);
    const picked = pool[pickIndex];
    if (owned.has(picked.id) || drops.some((drop) => drop.id === picked.id)) {
      duplicateCount += 1;
      continue;
    }

    drops.push(picked);
  }

  return {
    drops,
    duplicateCount,
    itemDropMultiplier,
    chances: calculateDropChances(safeAmount, itemDropMultiplier),
  };
}

export function analyzeInvestmentPayload({
  transcript = '',
  manualAmount = '',
  typeKey = '',
  currency = 'BRL',
  equipment = {},
  exchangeRates = {},
  now = new Date(),
} = {}) {
  const text = String(transcript || '');
  const classification = classifyInvestment(text, typeKey);
  const originalCurrency = detectCurrency(text, currency);
  const manualValue = parseCurrencyInput(manualAmount);
  const originalAmount = manualValue || extractAmountFromText(text);
  const exchangeRate = originalCurrency === 'USD' ? Number(exchangeRates.usdBrl || exchangeRates.USD_BRL || 5) : 1;
  const amount = originalCurrency === 'USD' ? Number((originalAmount * exchangeRate).toFixed(2)) : originalAmount;
  const typeConfig = INVESTMENT_TYPES[classification.typeKey] || INVESTMENT_TYPES['tesouro-selic'];
  const amountFactor = Math.max(1, Math.log10(Math.max(10, amount || 10)));
  const { xpMultiplier, itemDropMultiplier } = getEquipmentMultipliers(equipment);
  const xpGranted = Math.round((typeConfig.baseXp + amountFactor * 32) * xpMultiplier);
  const powerGranted = Math.round(typeConfig.power + amountFactor * 8);

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
    xpMultiplier,
    itemDropMultiplier,
    confidence: classification.confidence,
    matchedKeywords: classification.matchedKeywords,
    learning: typeConfig.learning,
    createdAt: now instanceof Date ? now.toISOString() : new Date(now).toISOString(),
  };
}

export function getOwnedItems(inventory = []) {
  return [...new Set(inventory)].map((itemId) => ITEM_MAP[itemId]).filter(Boolean);
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
      return category === 'renda-fixa' ? total + amount : total;
    }, 0),
    byType,
    byCategory,
  };
}

function metricValue(metric, context) {
  const largestSet = Math.max(0, ...Object.values(getSetCounts(context.equipment || {})));
  const ownedItems = getOwnedItems(context.inventory || []);

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
    case 'inventoryCount':
      return ownedItems.length;
    case 'artifactCount':
      return ownedItems.filter((item) => item.rarity === 'artefato').length;
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
  const level = Math.floor(Math.sqrt(safeXp / 140)) + 1;
  const currentLevelXp = (level - 1) ** 2 * 140;
  const nextLevelXp = level ** 2 * 140;
  const progress = nextLevelXp === currentLevelXp ? 1 : (safeXp - currentLevelXp) / (nextLevelXp - currentLevelXp);

  return {
    level,
    totalXp: safeXp,
    currentLevelXp,
    nextLevelXp,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

export function getAdvisorLine({ history = [], summary = getHistorySummary(history), equipment = {}, inventory = [] } = {}) {
  const activeBonuses = getActiveSetBonuses(equipment);

  if (!history.length) {
    return 'Comece registrando um aporte simples. Antes de confirmar, leia objetivo, liquidez e riscos do investimento escolhido.';
  }

  if (!inventory.length) {
    return 'Você já tem registros. Continue usando categorias pré-definidas para comparar produtos de forma mais consistente.';
  }

  if (summary.fixedIncomeAmount < 1000) {
    return 'Sua base de renda fixa ainda pode crescer. Tesouro Selic, CDB ou LCI/LCA ajudam a estudar reserva, crédito e liquidez.';
  }

  if (summary.categoryCount < 3) {
    return 'Você já tem uma base inicial. Explore novas categorias para entender riscos diferentes antes de diversificar de verdade.';
  }

  if (!activeBonuses.length) {
    return 'Use os itens como lembrete de estudo: cada equipamento representa uma decisão validada e um conceito aprendido.';
  }

  return 'Seu histórico está mais completo. Continue equilibrando objetivo, prazo, liquidez, custo e risco.';
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
    'poder',
    'multiplicador_xp',
    'multiplicador_itens',
    'itens',
    'hash',
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
    String(entry.xpMultiplier || 1),
    String(entry.itemDropMultiplier || 1),
    (entry.droppedItems || []).map((item) => item.name).join(', '),
    entry.hash || '',
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(';'),
    )
    .join('\n');
}

function findSlotForItem(item, equipment = {}) {
  if (!item) return null;
  const direct = SLOT_ORDER.find((slot) => slot.key === item.slot);
  if (direct) return direct.key;
  const accepted = SLOT_ORDER.find((slot) => slot.accepts?.includes(item.slot) && !equipment[slot.key]);
  if (accepted) return accepted.key;
  return SLOT_ORDER.find((slot) => slot.accepts?.includes(item.slot))?.key || null;
}

export function equipItem(state, itemId) {
  const item = ITEM_MAP[itemId];
  const slotKey = findSlotForItem(item, state.equipment);
  if (!item || !slotKey) {
    return state;
  }

  return {
    ...state,
    equipment: {
      ...state.equipment,
      [slotKey]: item.id,
    },
  };
}

export function autoEquipBestDrops(state, drops = []) {
  return drops
    .sort((a, b) => b.power - a.power)
    .reduce((nextState, item) => {
      const slotKey = findSlotForItem(item, nextState.equipment);
      if (!slotKey) return nextState;
      const equipped = ITEM_MAP[nextState.equipment[slotKey]];
      if (!equipped || item.power > equipped.power) {
        return equipItem(nextState, item.id);
      }
      return nextState;
    }, state);
}

export function getRarityMeta(rarity = 'comum') {
  return RARITY_META[rarity] || RARITY_META.comum;
}
