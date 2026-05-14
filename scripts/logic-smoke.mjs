import assert from 'node:assert/strict';

import { ITEM_LIBRARY } from '../src/gameData.js';
import {
  analyzeInvestmentPayload,
  buildCsv,
  calculateProfilePower,
  createInitialGameState,
  getAchievementStatuses,
  getActiveSetBonuses,
  getHistorySummary,
  getLevelState,
  getNextItemReward,
  getOwnedItems,
  getQuestStatuses,
  mergeGameState,
  parseCurrencyInput,
} from '../src/mobileGameLogic.js';

function testCurrencyParsing() {
  assert.equal(parseCurrencyInput('R$ 1.250,75'), 1250.75);
  assert.equal(parseCurrencyInput('US$ 1,250.75'), 1250.75);
}

function testInvestmentAnalysis() {
  const selic = analyzeInvestmentPayload({
    transcript: 'Compra confirmada de Tesouro Selic no valor total de R$ 1.250,00',
    exchangeRates: { usdBrl: 5.1 },
  });

  assert.equal(selic.typeKey, 'tesouro-selic');
  assert.equal(selic.amount, 1250);
  assert.ok(selic.xpGranted > 0);
  assert.ok(selic.powerGranted > 0);

  const global = analyzeInvestmentPayload({
    transcript: 'Aplicação em ETF IVVB11 no valor de US$ 100.00',
    exchangeRates: { usdBrl: 5.1 },
  });

  assert.equal(global.typeKey, 'etf');
  assert.equal(global.originalCurrency, 'USD');
  assert.equal(global.amount, 510);
  assert.equal(global.wasConverted, true);
}

function testProgressionAndCsv() {
  const initial = createInitialGameState();
  const analysis = analyzeInvestmentPayload({
    transcript: 'Aporte em CDB com valor aplicado de R$ 2.000,00',
  });
  const rewardItem = getNextItemReward(analysis.typeKey, initial.inventory);
  const record = {
    id: 'smoke-1',
    createdAt: '2026-05-07T12:00:00.000Z',
    hash: 'abc123def456',
    proofName: 'comprovante-cdb.txt',
    ...analysis,
  };
  const state = {
    ...initial,
    meta: { ...initial.meta, characterCreated: true },
    history: [record],
    inventory: rewardItem ? [rewardItem.id] : [],
  };
  const summary = getHistorySummary(state.history);
  const power = calculateProfilePower(state.equipment, state.history);
  const quests = getQuestStatuses({
    history: state.history,
    summary,
    power,
    equipment: state.equipment,
    exportCount: 0,
  });
  const achievements = getAchievementStatuses({
    history: state.history,
    summary,
    power,
    equipment: state.equipment,
    exportCount: 0,
  });
  const csv = buildCsv(state.history);

  assert.equal(summary.totalAmount, 2000);
  assert.ok(power.total > 0);
  assert.ok(quests.some((quest) => quest.id === 'primeiro-comprovante' && quest.completed));
  assert.ok(achievements.some((achievement) => achievement.id === 'primeiro-registro' && achievement.completed));
  assert.ok(csv.includes('comprovante-cdb.txt'));
  assert.ok(getOwnedItems(state.inventory).length >= 1);
}

function testEquipmentSetsAndMigrations() {
  const setItems = ITEM_LIBRARY.filter((item) => item.setName === 'Trilha da Reserva Estável').slice(0, 4);
  assert.equal(setItems.length, 4);

  const equipment = {
    head: setItems[0].id,
    shoulders: setItems[1].id,
    chest: setItems[2].id,
    hands: setItems[3].id,
  };
  const activeBonuses = getActiveSetBonuses(equipment);
  assert.ok(activeBonuses.some((bonus) => bonus.pieces === 2));
  assert.ok(activeBonuses.some((bonus) => bonus.pieces === 4));

  const invalidSave = mergeGameState({ meta: { saveVersion: 1 }, history: [{ id: 'old' }] });
  assert.equal(invalidSave.history.length, 0);
}

function testLeveling() {
  assert.equal(getLevelState(0).level, 1);
  assert.ok(getLevelState(1000).level > 1);
}

testCurrencyParsing();
testInvestmentAnalysis();
testProgressionAndCsv();
testEquipmentSetsAndMigrations();
testLeveling();

console.log('Finance Quest logic smoke tests passed.');
