import { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  APP_NAME,
  CHARACTER_CLASSES,
  CHARACTER_RACES,
  ITEM_LIBRARY,
  SLOT_ORDER,
} from './gameData.js';
import {
  analyzeInvestmentPayload,
  buildCsv,
  calculateProfilePower,
  createInitialGameState,
  equipFirstCompatibleItem,
  formatCompact,
  formatCurrency,
  getAchievementStatuses,
  getActiveSetBonuses,
  getAdvisorLine,
  getHistorySummary,
  getLevelState,
  getNextItemReward,
  getOwnedItems,
  getQuestStatuses,
  getRarityMeta,
  shortHash,
} from './mobileGameLogic.js';

const APP_ICON = require('../assets/icon.png');
const STORAGE_KEY = 'finance-quest-state-v2';

const TABS = [
  { key: 'inicio', label: 'Início', icon: 'home-analytics' },
  { key: 'missoes', label: 'Missões', icon: 'flag-checkered' },
  { key: 'validacao', label: 'Validar', icon: 'text-box-check-outline' },
  { key: 'marcos', label: 'Marcos', icon: 'view-grid-plus-outline' },
  { key: 'perfil', label: 'Perfil', icon: 'account-circle-outline' },
];

const SAMPLE_RECEIPT =
  'Compra confirmada de Tesouro Selic no valor total de R$ 1.250,00. Objetivo: reserva de emergência.';

function loadState() {
  if (Platform.OS !== 'web') {
    return createInitialGameState();
  }

  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? createInitialGameState(JSON.parse(raw)) : createInitialGameState();
  } catch {
    return createInitialGameState();
  }
}

function persistState(nextState) {
  if (Platform.OS !== 'web') {
    return;
  }

  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Persistência é opcional no web preview.
  }
}

function ProgressBar({ value, color = '#2DD4BF' }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function Chip({ children, tone = 'teal' }) {
  const chipStyle = tone === 'amber' ? styles.chipAmber : tone === 'coral' ? styles.chipCoral : styles.chipTeal;
  return (
    <View style={[styles.chip, chipStyle]}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}

function SectionHeader({ eyebrow, title, right }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function StatCard({ icon, label, value, color = '#2DD4BF' }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ children, icon, onPress, disabled = false, tone = 'teal' }) {
  const colors = tone === 'amber' ? ['#F6C453', '#EBAA2A'] : tone === 'coral' ? ['#FF8B7E', '#F25F4C'] : ['#2DD4BF', '#5AC8FA'];

  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[styles.buttonWrap, disabled && styles.disabled]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
        {icon ? <MaterialCommunityIcons name={icon} size={18} color="#07111F" /> : null}
        <Text style={styles.primaryButtonText}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function TabButton({ tab, active, onPress }) {
  return (
    <Pressable testID={`tab-${tab.key}`} onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <MaterialCommunityIcons name={tab.icon} size={22} color={active ? '#07111F' : '#C7D7E5'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

function CreationScreen({ onCreate }) {
  const [name, setName] = useState('');
  const [race, setRace] = useState(CHARACTER_RACES[0].key);
  const [classKey, setClassKey] = useState(CHARACTER_CLASSES[0].key);
  const isValid = name.trim().length >= 3;

  return (
    <LinearGradient colors={['#07111F', '#0B1726', '#102033']} style={styles.creation}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.creationHero}>
          <Image source={APP_ICON} style={styles.logo} />
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.creationSubtitle}>
            Uma jornada educacional para transformar comprovantes, metas e investimentos em aprendizado prático.
          </Text>
        </View>

        <View style={styles.creationPanel}>
          <Text style={styles.inputLabel}>Nome do usuário</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome do usuário"
            placeholderTextColor="#8FA6BA"
            style={styles.input}
            maxLength={24}
          />

          <Text style={styles.inputLabel}>Perfil de aprendizagem</Text>
          <View style={styles.optionGrid}>
            {CHARACTER_RACES.map((entry) => (
              <Pressable
                key={entry.key}
                onPress={() => setRace(entry.key)}
                style={[styles.option, race === entry.key && styles.optionActive]}
              >
                <Text style={styles.optionTitle}>{entry.label}</Text>
                <Text style={styles.optionText}>{entry.bonus}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Trilha financeira</Text>
          <View style={styles.optionGrid}>
            {CHARACTER_CLASSES.map((entry) => (
              <Pressable
                key={entry.key}
                onPress={() => setClassKey(entry.key)}
                style={[styles.option, classKey === entry.key && styles.optionActive]}
              >
                <Text style={styles.optionTitle}>{entry.label}</Text>
                <Text style={styles.optionText}>{entry.bonus}</Text>
              </Pressable>
            ))}
          </View>

          <PrimaryButton
            icon="rocket-launch-outline"
            disabled={!isValid}
            onPress={() => onCreate({ name: name.trim(), race, classKey })}
          >
            Começar jornada
          </PrimaryButton>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function MissionRow({ mission }) {
  return (
    <View style={styles.listCard}>
      <View style={styles.listIcon}>
        <MaterialCommunityIcons name={mission.completed ? 'check-bold' : 'progress-clock'} size={18} color={mission.completed ? '#07111F' : '#F6C453'} />
      </View>
      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{mission.title}</Text>
        <Text style={styles.listText}>{mission.description}</Text>
        <ProgressBar value={mission.progress} color={mission.completed ? '#62D6A6' : '#F6C453'} />
        <Text style={styles.listMeta}>
          {formatCompact(mission.value)} de {formatCompact(mission.target)} · {mission.reward}
        </Text>
      </View>
    </View>
  );
}

function ItemCard({ item, equipped, owned, onEquip }) {
  const rarity = getRarityMeta(item.rarity);
  return (
    <Pressable onPress={owned ? () => onEquip(item) : undefined} style={[styles.itemCard, owned && styles.itemOwned, equipped && styles.itemEquipped]}>
      <View style={[styles.itemGlyph, { borderColor: rarity.color }]}>
        <MaterialCommunityIcons name={equipped ? 'star-check' : owned ? 'star-four-points' : 'lock-outline'} size={24} color={rarity.color} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.rarity, { color: rarity.color }]}>{rarity.label}</Text>
        </View>
        <Text style={styles.itemText}>{item.flavor}</Text>
        <Text style={styles.itemMeta}>{item.setName} · {item.bonusLabel}</Text>
      </View>
    </Pressable>
  );
}

export default function MobileApp() {
  const dimensions = useWindowDimensions();
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState('inicio');
  const [receipt, setReceipt] = useState(SAMPLE_RECEIPT);
  const [notice, setNotice] = useState('');
  const shellWidth = Math.min(dimensions.width, 540);

  const summary = useMemo(() => getHistorySummary(state.history), [state.history]);
  const power = useMemo(() => calculateProfilePower(state.equipment, state.history), [state.equipment, state.history]);
  const level = useMemo(() => getLevelState(summary.totalXp), [summary.totalXp]);
  const quests = useMemo(
    () =>
      getQuestStatuses({
        history: state.history,
        summary,
        power,
        equipment: state.equipment,
        exportCount: state.meta.exportCount,
      }),
    [state.history, summary, power, state.equipment, state.meta.exportCount],
  );
  const achievements = useMemo(
    () =>
      getAchievementStatuses({
        history: state.history,
        summary,
        power,
        equipment: state.equipment,
        exportCount: state.meta.exportCount,
      }),
    [state.history, summary, power, state.equipment, state.meta.exportCount],
  );
  const ownedItems = useMemo(() => getOwnedItems(state.inventory), [state.inventory]);
  const activeBonuses = useMemo(() => getActiveSetBonuses(state.equipment), [state.equipment]);
  const advisorLine = useMemo(() => getAdvisorLine({ history: state.history, summary, equipment: state.equipment }), [state.history, summary, state.equipment]);

  function commitState(nextState) {
    const withDate = {
      ...nextState,
      meta: {
        ...nextState.meta,
        updatedAt: new Date().toISOString(),
      },
    };
    setState(withDate);
    persistState(withDate);
  }

  function handleCreate(player) {
    const nextState = createInitialGameState({
      ...state,
      player,
      meta: {
        ...state.meta,
        characterCreated: true,
        createdAt: new Date().toISOString(),
      },
    });
    commitState(nextState);
  }

  function handleValidate() {
    const analysis = analyzeInvestmentPayload({
      transcript: receipt,
      equipment: state.equipment,
      exchangeRates: { usdBrl: 5.1 },
    });
    const reward = getNextItemReward(analysis.typeKey, state.inventory);
    const record = {
      id: `registro-${Date.now()}`,
      proofName: 'registro-manual.txt',
      hash: shortHash(`${receipt}-${Date.now()}`),
      ...analysis,
    };
    const inventory = reward ? [...state.inventory, reward.id] : state.inventory;
    const withReward = reward
      ? equipFirstCompatibleItem({ ...state, inventory }, reward.id)
      : { ...state, inventory };

    commitState({
      ...withReward,
      history: [record, ...state.history],
      wallet: {
        ...state.wallet,
        coins: state.wallet.coins + Math.round(analysis.xpGranted / 4),
        credits: state.wallet.credits + (reward ? 1 : 0),
      },
    });
    setNotice(
      reward
        ? `Registro validado: ${analysis.typeTitle}. Novo marco desbloqueado: ${reward.name}.`
        : `Registro validado: ${analysis.typeTitle}. A trilha recebeu XP e pontuação.`,
    );
  }

  function handleEquip(item) {
    commitState(equipFirstCompatibleItem(state, item.id));
    setNotice(`${item.name} equipado no perfil.`);
  }

  function handleExport() {
    const csv = buildCsv(state.history);
    commitState({
      ...state,
      meta: {
        ...state.meta,
        exportCount: state.meta.exportCount + 1,
      },
    });
    setNotice(`Relatório preparado com ${csv.split('\n').length - 1} registro(s).`);
  }

  function resetJourney() {
    const nextState = createInitialGameState();
    setState(nextState);
    persistState(nextState);
    setTab('inicio');
    setNotice('');
  }

  if (!state.meta.characterCreated) {
    return <CreationScreen onCreate={handleCreate} />;
  }

  const latest = state.history[0];

  function renderHome() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader
          eyebrow="Painel educacional"
          title={`Olá, ${state.player.name}`}
          right={<Chip tone="amber">Nível {level.level}</Chip>}
        />

        <View style={styles.statGrid}>
          <StatCard icon="chart-timeline-variant" label="Pontuação Total" value={formatCompact(power.total)} color="#2DD4BF" />
          <StatCard icon="cash-multiple" label="Valor registrado" value={formatCurrency(summary.totalAmount)} color="#F6C453" />
          <StatCard icon="school-outline" label="XP acumulado" value={formatCompact(summary.totalXp)} color="#5AC8FA" />
          <StatCard icon="shape-outline" label="Categorias" value={summary.categoryCount} color="#FF7A6B" />
        </View>

        <View style={styles.panel}>
          <SectionHeader eyebrow="Orientação" title="Próximo passo" />
          <Text style={styles.panelText}>{advisorLine}</Text>
          <ProgressBar value={level.progress} />
          <Text style={styles.panelMeta}>Progresso até o próximo nível</Text>
        </View>

        {latest ? (
          <View style={styles.panel}>
            <SectionHeader eyebrow="Último registro" title={latest.typeTitle} />
            <Text style={styles.panelText}>{latest.learning}</Text>
            <View style={styles.rowWrap}>
              <Chip>{formatCurrency(latest.amount)}</Chip>
              <Chip tone="amber">+{latest.xpGranted} XP</Chip>
              <Chip tone="coral">+{latest.powerGranted} pts</Chip>
            </View>
          </View>
        ) : (
          <View style={styles.panel}>
            <SectionHeader eyebrow="Começo rápido" title="Valide um comprovante" />
            <Text style={styles.panelText}>
              Use a aba Validar para registrar um investimento. O app classifica o tipo, calcula XP e libera marcos educacionais.
            </Text>
            <PrimaryButton icon="text-box-check-outline" onPress={() => setTab('validacao')}>
              Abrir validação
            </PrimaryButton>
          </View>
        )}
      </ScrollView>
    );
  }

  function renderMissions() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader eyebrow="Metas guiadas" title="Missões da jornada" />
        {quests.map((quest) => (
          <MissionRow key={quest.id} mission={quest} />
        ))}

        <SectionHeader eyebrow="Reconhecimento" title="Conquistas" />
        {achievements.map((achievement) => (
          <MissionRow key={achievement.id} mission={achievement} />
        ))}
      </ScrollView>
    );
  }

  function renderValidation() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader eyebrow="Leitura assistida" title="Validação financeira" />
        <Text style={styles.helperText}>
          Cole um texto de comprovante ou registre manualmente. O Finance Quest identifica categoria, valor, XP e pontuação.
        </Text>
        <TextInput
          value={receipt}
          onChangeText={setReceipt}
          multiline
          placeholder="Cole aqui o texto do comprovante"
          placeholderTextColor="#8FA6BA"
          style={styles.textArea}
        />
        <PrimaryButton icon="check-decagram-outline" onPress={handleValidate} disabled={!receipt.trim()}>
          Validar registro
        </PrimaryButton>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.panel}>
          <SectionHeader eyebrow="Exemplo" title="Como o texto é interpretado" />
          <Text style={styles.panelText}>
            Palavras como Tesouro Selic, CDB, FII, ETF, IPCA ou IVVB11 ajudam a classificar o investimento. Valores em dólar são convertidos para BRL na análise.
          </Text>
        </View>
      </ScrollView>
    );
  }

  function renderItems() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader eyebrow="Evolução visual" title="Biblioteca de Marcos" />
        <Text style={styles.helperText}>
          Marcos desbloqueados podem ser equipados para mostrar o foco do perfil e ativar bônus de trilha.
        </Text>
        {ITEM_LIBRARY.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            owned={state.inventory.includes(item.id)}
            equipped={Object.values(state.equipment).includes(item.id)}
            onEquip={handleEquip}
          />
        ))}
      </ScrollView>
    );
  }

  function renderProfile() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader eyebrow="Síntese" title="Maestria do portfólio" />
        <View style={styles.profileHero}>
          <Image source={APP_ICON} style={styles.profileIcon} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{state.player.name}</Text>
            <Text style={styles.profileMeta}>
              {CHARACTER_RACES.find((entry) => entry.key === state.player.race)?.label} · {CHARACTER_CLASSES.find((entry) => entry.key === state.player.classKey)?.label}
            </Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          <StatCard icon="star-four-points-outline" label="Marcos" value={ownedItems.length} color="#F6C453" />
          <StatCard icon="vector-combine" label="Trilhas ativas" value={activeBonuses.length} color="#62D6A6" />
          <StatCard icon="file-chart-outline" label="Registros" value={state.history.length} color="#5AC8FA" />
          <StatCard icon="database-export-outline" label="Relatórios" value={state.meta.exportCount} color="#FF7A6B" />
        </View>

        <View style={styles.panel}>
          <SectionHeader eyebrow="Equipamento educacional" title="Marcos equipados" />
          {SLOT_ORDER.map((slot) => {
            const item = ITEM_LIBRARY.find((entry) => entry.id === state.equipment[slot.key]);
            return (
              <View key={slot.key} style={styles.slotRow}>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                <Text style={styles.slotValue}>{item ? item.name : 'Vazio'}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.panel}>
          <SectionHeader eyebrow="Relatório" title="Histórico financeiro" />
          {state.history.slice(0, 4).map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyTitle}>{entry.typeTitle}</Text>
                <Text style={styles.historyMeta}>{entry.category} · {entry.hash}</Text>
              </View>
              <Text style={styles.historyValue}>{formatCurrency(entry.amount)}</Text>
            </View>
          ))}
          {!state.history.length ? <Text style={styles.panelText}>Nenhum registro validado ainda.</Text> : null}
          <PrimaryButton icon="file-delimited-outline" onPress={handleExport} tone="amber">
            Preparar relatório
          </PrimaryButton>
        </View>

        <Pressable onPress={resetJourney} style={styles.resetButton}>
          <Text style={styles.resetText}>Reiniciar jornada local</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const currentTab = TABS.find((entry) => entry.key === tab) || TABS[0];

  return (
    <LinearGradient colors={['#07111F', '#0B1726', '#102033']} style={styles.app}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.shell, { width: shellWidth }]}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topEyebrow}>{APP_NAME}</Text>
            <Text style={styles.topTitle}>{currentTab.label}</Text>
          </View>
          <View style={styles.scorePill}>
            <MaterialCommunityIcons name="chart-donut" size={16} color="#07111F" />
            <Text style={styles.scoreText}>{formatCompact(power.total)}</Text>
          </View>
        </View>

        {tab === 'inicio'
          ? renderHome()
          : tab === 'missoes'
            ? renderMissions()
            : tab === 'validacao'
              ? renderValidation()
              : tab === 'marcos'
                ? renderItems()
                : renderProfile()}

        <View style={styles.nav}>
          {TABS.map((entry) => (
            <TabButton key={entry.key} tab={entry} active={tab === entry.key} onPress={() => setTab(entry.key)} />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#07111F',
  },
  shell: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: '#07111F',
  },
  creation: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 34,
  },
  creationHero: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    marginBottom: 14,
  },
  appName: {
    color: '#F4F8FB',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  creationSubtitle: {
    color: '#C7D7E5',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 380,
  },
  creationPanel: {
    paddingBottom: 24,
  },
  inputLabel: {
    color: '#F4F8FB',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.24)',
    backgroundColor: 'rgba(16,32,51,0.92)',
    color: '#F4F8FB',
    paddingHorizontal: 14,
    fontSize: 16,
  },
  optionGrid: {
    gap: 10,
  },
  option: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(143,166,186,0.22)',
    backgroundColor: 'rgba(11,23,38,0.72)',
    padding: 12,
  },
  optionActive: {
    borderColor: '#2DD4BF',
    backgroundColor: 'rgba(45,212,191,0.12)',
  },
  optionTitle: {
    color: '#F4F8FB',
    fontWeight: '800',
    fontSize: 14,
  },
  optionText: {
    color: '#C7D7E5',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  topBar: {
    minHeight: 86,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(125,211,252,0.14)',
  },
  topEyebrow: {
    color: '#62D6A6',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  topTitle: {
    color: '#F4F8FB',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  scorePill: {
    minWidth: 74,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F6C453',
  },
  scoreText: {
    color: '#07111F',
    fontWeight: '900',
  },
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  eyebrow: {
    color: '#62D6A6',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  sectionTitle: {
    color: '#F4F8FB',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.5%',
    minHeight: 104,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.16)',
    backgroundColor: 'rgba(16,32,51,0.82)',
    padding: 12,
    justifyContent: 'space-between',
  },
  statLabel: {
    color: '#C7D7E5',
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: '#F4F8FB',
    fontSize: 20,
    fontWeight: '900',
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.16)',
    backgroundColor: 'rgba(11,23,38,0.76)',
    padding: 14,
    gap: 10,
  },
  panelText: {
    color: '#C7D7E5',
    fontSize: 14,
    lineHeight: 21,
  },
  panelMeta: {
    color: '#8FA6BA',
    fontSize: 12,
  },
  helperText: {
    color: '#C7D7E5',
    fontSize: 14,
    lineHeight: 21,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(143,166,186,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  chipTeal: {
    backgroundColor: 'rgba(45,212,191,0.16)',
  },
  chipAmber: {
    backgroundColor: 'rgba(246,196,83,0.18)',
  },
  chipCoral: {
    backgroundColor: 'rgba(255,122,107,0.18)',
  },
  chipText: {
    color: '#F4F8FB',
    fontSize: 12,
    fontWeight: '800',
  },
  listCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.16)',
    backgroundColor: 'rgba(16,32,51,0.82)',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6C453',
  },
  listContent: {
    flex: 1,
    gap: 7,
  },
  listTitle: {
    color: '#F4F8FB',
    fontSize: 15,
    fontWeight: '900',
  },
  listText: {
    color: '#C7D7E5',
    fontSize: 13,
    lineHeight: 18,
  },
  listMeta: {
    color: '#8FA6BA',
    fontSize: 12,
  },
  textArea: {
    minHeight: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.24)',
    backgroundColor: 'rgba(16,32,51,0.92)',
    color: '#F4F8FB',
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  notice: {
    color: '#07111F',
    backgroundColor: '#62D6A6',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  itemCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(143,166,186,0.14)',
    backgroundColor: 'rgba(11,23,38,0.62)',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    opacity: 0.68,
  },
  itemOwned: {
    opacity: 1,
    borderColor: 'rgba(98,214,166,0.28)',
  },
  itemEquipped: {
    backgroundColor: 'rgba(45,212,191,0.12)',
  },
  itemGlyph: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,17,31,0.72)',
  },
  itemContent: {
    flex: 1,
    gap: 5,
  },
  itemTitleRow: {
    gap: 3,
  },
  itemName: {
    color: '#F4F8FB',
    fontSize: 14,
    fontWeight: '900',
  },
  rarity: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  itemText: {
    color: '#C7D7E5',
    fontSize: 12,
    lineHeight: 17,
  },
  itemMeta: {
    color: '#8FA6BA',
    fontSize: 11,
    lineHeight: 16,
  },
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.16)',
    backgroundColor: 'rgba(16,32,51,0.82)',
    padding: 14,
  },
  profileIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    color: '#F4F8FB',
    fontSize: 22,
    fontWeight: '900',
  },
  profileMeta: {
    color: '#C7D7E5',
    fontSize: 13,
    lineHeight: 18,
  },
  slotRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(143,166,186,0.12)',
  },
  slotLabel: {
    color: '#8FA6BA',
    fontSize: 12,
    fontWeight: '800',
  },
  slotValue: {
    flex: 1,
    color: '#F4F8FB',
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '700',
  },
  historyRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(143,166,186,0.12)',
  },
  historyTitle: {
    color: '#F4F8FB',
    fontSize: 13,
    fontWeight: '900',
  },
  historyMeta: {
    color: '#8FA6BA',
    fontSize: 11,
  },
  historyValue: {
    color: '#F6C453',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#07111F',
    fontWeight: '900',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.48,
  },
  nav: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.18)',
    backgroundColor: '#07111F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#2DD4BF',
  },
  tabLabel: {
    color: '#C7D7E5',
    fontSize: 10,
    fontWeight: '900',
  },
  tabLabelActive: {
    color: '#07111F',
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resetText: {
    color: '#8FA6BA',
    fontSize: 12,
    fontWeight: '800',
  },
});
