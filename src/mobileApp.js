import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
  INVESTMENT_CATEGORIES,
  INVESTMENT_GUIDE,
  INVESTMENT_TYPES,
  ITEM_LIBRARY,
  SOURCE_REFERENCES,
  SLOT_ORDER,
} from './gameData.js';
import {
  ITEM_MAP,
  analyzeInvestmentPayload,
  analyzeOcrText,
  autoEquipBestDrops,
  buildPortfolioAnalytics,
  buildCsv,
  calculateDropChances,
  calculateProfilePower,
  createInitialGameState,
  equipItem,
  formatCompact,
  formatCurrency,
  getAchievementStatuses,
  getActiveSetBonuses,
  getAdvisorLine,
  getEquipmentMultipliers,
  getHistorySummary,
  getInvestmentTypesByCategory,
  getLevelState,
  getOwnedItems,
  getQuestStatuses,
  getRarityMeta,
  parseCurrencyInput,
  rollItemDrops,
  shortHash,
} from './mobileGameLogic.js';

const STORAGE_KEY = 'finance-quest-state-v4';
const USD_BRL_RATE = 5.1;

const TABS = [
  { key: 'inicio', label: 'Início', icon: 'home-variant' },
  { key: 'aprender', label: 'Aprender', icon: 'book-open-page-variant' },
  { key: 'validacao', label: 'Validar', icon: 'text-box-check-outline' },
  { key: 'inventario', label: 'Itens', icon: 'bag-personal' },
  { key: 'perfil', label: 'Perfil', icon: 'account-circle' },
];

const OCR_SAMPLE =
  'Compra confirmada de Tesouro Selic no valor total de R$ 1.250,00. Objetivo: reserva de emergência.';

const RARITY_ORDER = {
  comum: 1,
  raro: 2,
  epico: 3,
  lendario: 4,
  artefato: 5,
};

const CHART_COLORS = ['#34D399', '#5AC8FA', '#FFD166', '#FF8A9A', '#A78BFA', '#F97316'];
const CATEGORY_COLORS = {
  'renda-fixa': '#34D399',
  'renda-variavel': '#FB7185',
  fundos: '#5AC8FA',
  global: '#A78BFA',
  'longo-prazo': '#FFD166',
};
const RISK_COLORS = {
  low: '#34D399',
  medium: '#F5C64F',
  high: '#FB7185',
};

const SLOT_ICON_MAP = {
  head: 'shield-crown-outline',
  shoulders: 'shield-half-full',
  chest: 'shield-lock-outline',
  hands: 'hand-coin-outline',
  neck: 'medal-outline',
  mainHand: 'chart-line',
  offHand: 'book-open-page-variant',
  feet: 'shoe-print',
  ring1: 'ring',
  ring2: 'ring',
};

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
    // A persistência é opcional no preview web.
  }
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value = 0) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function formatMultiplier(value = 1) {
  return `${Number(value || 1).toFixed(2).replace('.', ',')}x`;
}

function getCategoryLabel(categoryKey) {
  return INVESTMENT_CATEGORIES.find((entry) => entry.key === categoryKey)?.label || 'Categoria';
}

function getTypeConfig(typeKey) {
  return INVESTMENT_TYPES[typeKey] || INVESTMENT_TYPES['tesouro-selic'];
}

function getInvestmentGuide(typeKey) {
  return INVESTMENT_GUIDE[typeKey] || INVESTMENT_GUIDE['tesouro-selic'];
}

function getBestDrop(drops = []) {
  return [...drops].sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0))[0] || null;
}

function ProgressBar({ value, color = '#10B981' }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.round(clamp(value) * 100)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function PrimaryButton({ children, icon, onPress, disabled = false, tone = 'emerald', compact = false }) {
  const colors =
    tone === 'amber'
      ? ['#F5C64F', '#F59E0B']
    : tone === 'rose'
        ? ['#FB7185', '#E11D48']
        : ['#10B981', '#0F766E'];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      style={[styles.buttonWrap, compact && styles.buttonCompact, disabled && styles.disabled]}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
        {icon ? <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" /> : null}
        <Text style={styles.primaryButtonText} numberOfLines={1}>
          {children}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

function GhostButton({ children, icon, onPress, compact = false }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.ghostButton, compact && styles.ghostButtonCompact]}>
      {icon ? <MaterialCommunityIcons name={icon} size={17} color="#F8FAFC" /> : null}
      <Text style={styles.ghostButtonText} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

function ChoiceChip({ label, icon, selected, onPress, compact = false, testID }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={[styles.choiceChip, selected && styles.choiceChipActive, compact && styles.choiceChipCompact]}>
      {icon ? <MaterialCommunityIcons name={icon} size={17} color={selected ? '#FFFFFF' : '#94A3B8'} /> : null}
      <Text style={[styles.choiceText, selected && styles.choiceTextActive]} numberOfLines={compact ? 1 : 2}>
        {label}
      </Text>
    </Pressable>
  );
}

function RarityPill({ rarity }) {
  const meta = getRarityMeta(rarity);
  return (
    <View style={[styles.rarityPill, { borderColor: meta.color, backgroundColor: `${meta.aura}22` }]}>
      <Text style={[styles.rarityText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

function RiskBadge({ level, tone = 'medium' }) {
  const color = tone === 'low' ? '#34D399' : tone === 'high' ? '#FB7185' : '#F59E0B';

  return (
    <View style={[styles.riskBadge, { borderColor: color, backgroundColor: `${color}16` }]}>
      <Text style={[styles.riskBadgeText, { color }]}>Risco {level}</Text>
    </View>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <View style={styles.infoLine}>
      <MaterialCommunityIcons name={icon} size={18} color="#34D399" />
      <View style={styles.infoLineText}>
        <Text style={styles.infoLineLabel}>{label}</Text>
        <Text style={styles.infoLineValue}>{value}</Text>
      </View>
    </View>
  );
}

function BulletList({ items = [] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function EducationCard({ typeKey, compact = false }) {
  const type = getTypeConfig(typeKey);
  const guide = getInvestmentGuide(typeKey);

  return (
    <View style={[styles.educationCard, compact && styles.educationInline]}>
      <View style={styles.educationTop}>
        <View style={styles.educationTitleWrap}>
          <View style={styles.educationIcon}>
            <MaterialCommunityIcons name={type.icon} size={22} color="#A7F3D0" />
          </View>
          <View style={styles.educationNameWrap}>
            <Text style={[styles.educationTitle, compact && styles.educationTitleCompact]}>{type.title}</Text>
            <Text style={[styles.educationCategory, compact && styles.educationCategoryCompact]}>{getCategoryLabel(type.category)}</Text>
          </View>
        </View>
        <RiskBadge level={guide.riskLevel} tone={guide.riskTone} />
      </View>

      <Text style={[styles.educationSummary, compact && styles.educationSummaryCompact]}>{guide.summary}</Text>

      {!compact ? (
        <View style={styles.infoGrid}>
          <InfoLine icon="target" label="Objetivo" value={guide.objective} />
          <InfoLine icon="clock-outline" label="Liquidez" value={guide.liquidity} />
          <InfoLine icon="shield-check-outline" label="Garantia" value={guide.guarantee} />
          <InfoLine icon="receipt-text-outline" label="Custos" value={guide.costs} />
        </View>
      ) : (
        <Text style={styles.compactMetaText}>
          Objetivo: {guide.objective} Liquidez: {guide.liquidity}
        </Text>
      )}

      {!compact ? (
        <>
          <Text style={styles.educationSubTitle}>Riscos principais</Text>
          <BulletList items={guide.risks} />
          <Text style={styles.educationSubTitle}>Antes de investir, confira</Text>
          <BulletList items={guide.checklist} />
        </>
      ) : (
        <View style={styles.compactRiskBox}>
          <Text style={styles.compactRiskText}>{guide.risks[0]}</Text>
        </View>
      )}
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

function StatTile({ icon, label, value, color = '#0F7B63' }) {
  return (
    <View style={styles.statTile}>
      <MaterialCommunityIcons name={icon} size={19} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function TabButton({ tab, active, onPress }) {
  return (
    <Pressable testID={`tab-${tab.key}`} accessibilityRole="button" onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <MaterialCommunityIcons name={tab.icon} size={21} color={active ? '#FFFFFF' : '#94A3B8'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

function MagicBurst({ event }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!event) {
      return undefined;
    }

    opacity.setValue(0);
    scale.setValue(0.82);
    rotate.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(1250),
        Animated.timing(opacity, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    return undefined;
  }, [event, opacity, rotate, scale]);

  if (!event) {
    return null;
  }

  const meta = getRarityMeta(event.rarity || 'comum');
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '18deg'] });
  const particles = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <Animated.View pointerEvents="none" style={[styles.magicOverlay, { opacity }]}>
      <Animated.View
        style={[
          styles.magicCard,
          {
            borderColor: meta.color,
            transform: [{ scale }, { rotate: spin }],
            shadowColor: meta.aura,
          },
        ]}
      >
        {particles.map((particle) => (
          <View
            key={particle}
            style={[
              styles.magicParticle,
              {
                backgroundColor: particle % 2 ? meta.color : '#FFFFFF',
                transform: [{ rotate: `${particle * 45}deg` }, { translateY: -62 }],
              },
            ]}
          />
        ))}
        <View style={[styles.magicIcon, { backgroundColor: `${meta.aura}55` }]}>
          <MaterialCommunityIcons name={event.type === 'level' ? 'creation' : 'auto-fix'} size={44} color={meta.color} />
        </View>
        <Text style={styles.magicTitle}>{event.title}</Text>
        <Text style={styles.magicSubtitle}>{event.subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function CreationScreen({ onCreate }) {
  const [name, setName] = useState('');
  const [race, setRace] = useState(CHARACTER_RACES[0].key);
  const [classKey, setClassKey] = useState(CHARACTER_CLASSES[0].key);
  const isValid = name.trim().length >= 3;

  return (
    <LinearGradient colors={['#020409', '#070A12', '#0B111C']} style={styles.creation}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.creationContent}>
        <View style={styles.creationHero}>
          <LinearGradient colors={['#0F7B63', '#3FB7B5']} style={styles.logoCrest}>
            <MaterialCommunityIcons name="school-outline" size={38} color="#FFFFFF" />
            <Text style={styles.logoText}>FQ</Text>
          </LinearGradient>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.creationSubtitle}>
            Crie um perfil, registre aportes e aprenda o objetivo, a liquidez e os riscos de cada investimento.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.inputLabel}>Nome do usuário</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome do usuário"
            placeholderTextColor="#64748B"
            style={styles.input}
            maxLength={24}
          />

          <Text style={styles.inputLabel}>Perfil de aprendizagem</Text>
          <View style={styles.optionStack}>
            {CHARACTER_RACES.map((entry) => (
              <Pressable
                key={entry.key}
                onPress={() => setRace(entry.key)}
                style={[styles.optionRow, race === entry.key && styles.optionRowActive]}
              >
                <MaterialCommunityIcons name={entry.key === 'guardiao' ? 'shield-check' : entry.key === 'arcanista' ? 'chart-timeline-variant' : 'scale-balance'} size={20} color={race === entry.key ? '#FFFFFF' : '#34D399'} />
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionTitle, race === entry.key && styles.optionTitleActive]}>{entry.label}</Text>
                  <Text style={[styles.optionText, race === entry.key && styles.optionTextActive]}>{entry.bonus}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Trilha inicial</Text>
          <View style={styles.optionStack}>
            {CHARACTER_CLASSES.map((entry) => (
              <Pressable
                key={entry.key}
                onPress={() => setClassKey(entry.key)}
                style={[styles.optionRow, classKey === entry.key && styles.optionRowActive]}
              >
            <MaterialCommunityIcons name={entry.key === 'renda-fixa' ? 'shield-check' : entry.key === 'diversificacao' ? 'compass' : 'timer-sand'} size={20} color={classKey === entry.key ? '#FFFFFF' : '#34D399'} />
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionTitle, classKey === entry.key && styles.optionTitleActive]}>{entry.label}</Text>
                  <Text style={[styles.optionText, classKey === entry.key && styles.optionTextActive]}>{entry.bonus}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <PrimaryButton icon="check-circle" disabled={!isValid} onPress={() => onCreate({ name: name.trim(), race, classKey })}>
            Começar trilha
          </PrimaryButton>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function HomeView({ state, summary, power, levelState, multipliers, setTab }) {
  const advisorLine = getAdvisorLine({ history: state.history, summary, equipment: state.equipment, inventory: state.inventory });
  const latest = state.history[0];
  const activeSets = getActiveSetBonuses(state.equipment);
  const equippedItems = multipliers.equippedItems;

  return (
    <View style={styles.screenStack}>
      <LinearGradient colors={['#020409', '#07111F', '#063E33']} style={styles.heroPanel}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.eyebrowLight}>Painel financeiro</Text>
            <Text style={styles.heroTitle}>{state.player.name}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLabel}>Nível</Text>
            <Text style={styles.levelNumber}>{levelState.level}</Text>
          </View>
        </View>
        <Text style={styles.heroCopy}>{advisorLine}</Text>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>XP {formatCompact(levelState.totalXp)}</Text>
          <Text style={styles.xpLabel}>{formatPercent(levelState.progress)}</Text>
        </View>
        <ProgressBar value={levelState.progress} color="#FFD166" />
        <View style={styles.heroActions}>
          <PrimaryButton icon="auto-fix" compact onPress={() => setTab('validacao')}>
            Validar
          </PrimaryButton>
          <GhostButton icon="book-open-page-variant" compact onPress={() => setTab('aprender')}>
            Aprender
          </GhostButton>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatTile icon="star-four-points" label="Poder Total" value={formatCompact(power.total)} color="#FFD166" />
        <StatTile icon="cash-multiple" label="Investido" value={formatCurrency(summary.totalAmount)} color="#10B981" />
        <StatTile icon="package-variant-closed" label="Itens" value={String(state.inventory.length)} color="#5AC8FA" />
        <StatTile icon="dice-multiple" label="Itens" value={formatMultiplier(multipliers.itemDropMultiplier)} color="#FF6B5F" />
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="Build financeira" title="Equipamentos ativos" />
        {equippedItems.length ? (
          <View style={styles.itemMiniGrid}>
            {equippedItems.slice(0, 4).map((item) => {
              const rarity = getRarityMeta(item.rarity);
              return (
                <View key={item.id} style={[styles.itemMini, { borderColor: `${rarity.color}88` }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={rarity.color} />
                  <Text style={styles.itemMiniName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhum equipamento ativo. Valide um aporte depois de revisar objetivo, liquidez e riscos.</Text>
        )}
        {activeSets.length ? (
          <View style={styles.setList}>
            {activeSets.map((bonus) => (
              <Text key={`${bonus.setName}-${bonus.pieces}`} style={styles.setLine}>
                {bonus.setName}: {bonus.label}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="Última validação" title={latest ? latest.typeTitle : 'Nenhum registro ainda'} />
        {latest ? (
          <View style={styles.latestBox}>
            <View>
              <Text style={styles.latestValue}>{formatCurrency(latest.amount)}</Text>
              <Text style={styles.latestMeta}>
                +{latest.xpGranted} XP · {getCategoryLabel(latest.category)}
              </Text>
            </View>
            <RarityPill rarity={latest.droppedItems?.[0]?.rarity || 'comum'} />
          </View>
        ) : (
          <Text style={styles.emptyText}>A aba Validar cria registros automáticos com XP, poder e chance de item educativo.</Text>
        )}
      </View>
    </View>
  );
}

function MissionCard({ entry }) {
  return (
    <View style={styles.missionCard}>
      <View style={[styles.missionIcon, entry.completed && styles.missionIconDone]}>
        <MaterialCommunityIcons name={entry.completed ? 'check-bold' : 'progress-clock'} size={18} color={entry.completed ? '#FFFFFF' : '#F5C64F'} />
      </View>
      <View style={styles.missionBody}>
        <View style={styles.missionTitleRow}>
          <Text style={styles.missionTitle}>{entry.title}</Text>
          <Text style={styles.missionCount}>
            {formatCompact(entry.value)} / {formatCompact(entry.target)}
          </Text>
        </View>
        <Text style={styles.missionText}>{entry.description}</Text>
        {entry.reward ? <Text style={styles.rewardText}>{entry.reward}</Text> : null}
        <ProgressBar value={entry.progress} color={entry.completed ? '#10B981' : '#F5C64F'} />
      </View>
    </View>
  );
}

function MissionsView({ quests, achievements }) {
  return (
    <View style={styles.screenStack}>
      <View style={styles.panel}>
        <SectionHeader eyebrow="Plano de estudos" title="Missões educativas" />
        <View style={styles.listStack}>
          {quests.map((quest) => (
            <MissionCard key={quest.id} entry={quest} />
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="Conquistas" title="Marcos de progresso" />
        <View style={styles.listStack}>
          {achievements.map((achievement) => (
            <MissionCard key={achievement.id} entry={achievement} />
          ))}
        </View>
      </View>
    </View>
  );
}

function LearnView({ selectedType, setSelectedType, quests }) {
  const typeEntries = Object.entries(INVESTMENT_TYPES).map(([key, config]) => ({ key, ...config }));
  const selectedGuide = getInvestmentGuide(selectedType);

  return (
    <View style={styles.screenStack}>
      <View style={styles.panel}>
        <SectionHeader eyebrow="Educação financeira" title="Aprenda antes de registrar" />
        <Text style={styles.helperText}>
          Cada investimento tem objetivo, prazo, custos e riscos. Use este guia para comparar antes de validar um aporte.
        </Text>
        <View style={styles.learnTypeGrid}>
          {typeEntries.map((type) => (
            <ChoiceChip
              key={type.key}
              label={type.title}
              icon={type.icon}
              selected={selectedType === type.key}
              onPress={() => setSelectedType(type.key)}
            />
          ))}
        </View>
      </View>

      <EducationCard typeKey={selectedType} />

      <View style={styles.panel}>
        <SectionHeader eyebrow="Resumo" title="O que observar" />
        <View style={styles.focusGrid}>
          <InfoLine icon="alert-circle-outline" label="Risco" value={selectedGuide.riskLevel} />
          <InfoLine icon="target-variant" label="Uso comum" value={selectedGuide.objective} />
          <InfoLine icon="cash-sync" label="Liquidez" value={selectedGuide.liquidity} />
        </View>
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="Progresso" title="Missões educativas" />
        <View style={styles.listStack}>
          {quests.slice(0, 3).map((quest) => (
            <MissionCard key={quest.id} entry={quest} />
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="Referências" title="Fontes usadas" />
        <View style={styles.sourceList}>
          {SOURCE_REFERENCES.map((source) => (
            <View key={source.label} style={styles.sourceRow}>
              <Text style={styles.sourceLabel}>{source.label}</Text>
              <Text style={styles.sourceFocus}>{source.focus}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function DropPreview({ amount, multiplier }) {
  const chances = calculateDropChances(amount, multiplier);

  return (
    <View style={styles.dropPreview}>
      {chances.map((entry) => {
        const meta = getRarityMeta(entry.rarity);
        return (
          <View key={entry.rarity} style={styles.dropRow}>
            <View style={styles.dropName}>
              <View style={[styles.dropDot, { backgroundColor: meta.color }]} />
              <Text style={styles.dropLabel}>{meta.label}</Text>
            </View>
            <View style={styles.dropTrack}>
              <View style={[styles.dropFill, { width: `${Math.max(4, Math.round(entry.chance * 100))}%`, backgroundColor: meta.color }]} />
            </View>
            <Text style={styles.dropChance}>{formatPercent(entry.chance)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ValidationView({
  amountInput,
  setAmountInput,
  currency,
  setCurrency,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  ocrText,
  setOcrText,
  ocrResult,
  setOcrResult,
  notice,
  multipliers,
  onAnalyzeOcr,
  onValidate,
}) {
  const parsedAmount = parseCurrencyInput(amountInput);
  const types = useMemo(() => getInvestmentTypesByCategory(selectedCategory), [selectedCategory]);
  const selectedConfig = getTypeConfig(selectedType);

  useEffect(() => {
    if (!types.some((entry) => entry.key === selectedType) && types[0]) {
      setSelectedType(types[0].key);
    }
  }, [selectedType, setSelectedType, types]);

  return (
    <View style={styles.screenStack}>
      <View style={styles.panel}>
        <SectionHeader eyebrow="Entrada guiada" title="Registro educativo" />
        <Text style={styles.helperText}>
          Digite a quantia, escolha uma categoria e revise riscos antes de confirmar. O comprovante pode ser analisado por OCR assistido quando houver texto disponível.
        </Text>

        <Text style={styles.inputLabel}>Quantia investida</Text>
        <View style={styles.amountRow}>
          <View style={styles.amountField}>
            <Text style={styles.amountCurrencyPrefix}>{currency === 'USD' ? 'US$' : 'R$'}</Text>
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              placeholder="0,00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>
          <View style={styles.currencyGroup}>
            {['BRL', 'USD'].map((entry) => (
              <ChoiceChip key={entry} label={entry} compact selected={currency === entry} onPress={() => setCurrency(entry)} />
            ))}
          </View>
        </View>

        <Text style={styles.inputLabel}>Categoria</Text>
        <View style={styles.chipGrid}>
          {INVESTMENT_CATEGORIES.map((category) => (
            <ChoiceChip
              key={category.key}
              label={category.label}
              icon={category.icon}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              testID={`category-${category.key}`}
            />
          ))}
        </View>

        <Text style={styles.inputLabel}>Opção pré-definida</Text>
        <View style={styles.typeList}>
          {types.map((type) => (
            <Pressable
              key={type.key}
              testID={`type-${type.key}`}
              onPress={() => setSelectedType(type.key)}
              style={[styles.typeOption, selectedType === type.key && styles.typeOptionActive]}
            >
              <View style={styles.typeLeft}>
                <MaterialCommunityIcons name={type.icon} size={21} color={selectedType === type.key ? '#FFFFFF' : '#34D399'} />
                <View style={styles.typeTextWrap}>
                  <Text style={[styles.typeTitle, selectedType === type.key && styles.typeTitleActive]}>{type.title}</Text>
                  <Text style={[styles.typeLearning, selectedType === type.key && styles.typeLearningActive]} numberOfLines={3}>
                    {type.learning}
                  </Text>
                </View>
              </View>
              <Text style={[styles.typeXp, selectedType === type.key && styles.typeXpActive]}>+{type.baseXp} XP</Text>
            </Pressable>
          ))}
        </View>

        <EducationCard typeKey={selectedType} compact />
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="OCR assistido" title="Leitura do comprovante" right={<GhostButton compact icon="file-search" onPress={() => setOcrText(OCR_SAMPLE)}>Exemplo</GhostButton>} />
        <TextInput
          value={ocrText}
          onChangeText={setOcrText}
          placeholder="Cole aqui o texto extraído do comprovante, nota de corretagem ou PDF."
          placeholderTextColor="#64748B"
          multiline
          style={[styles.input, styles.ocrInput]}
        />
        <View style={styles.buttonRow}>
          <GhostButton icon="eraser" onPress={() => {
            setOcrText('');
            setOcrResult(null);
          }}>
            Limpar OCR
          </GhostButton>
          <PrimaryButton icon="text-recognition" compact onPress={onAnalyzeOcr}>
            Analisar
          </PrimaryButton>
        </View>
        {ocrResult ? (
          <View style={styles.ocrResult}>
            <MaterialCommunityIcons name={ocrResult.confidence >= 0.7 ? 'check-decagram' : 'alert-circle'} size={20} color={ocrResult.confidence >= 0.7 ? '#34D399' : '#F5C64F'} />
            <View style={styles.ocrResultText}>
              <Text style={styles.ocrSummary}>{ocrResult.summary}</Text>
              <Text style={styles.ocrMeta}>
                Confiança {formatPercent(ocrResult.confidence)} · {getTypeConfig(ocrResult.typeKey).title}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="Recompensas" title="Chance de item educativo" />
        <View style={styles.rewardPreview}>
          <View>
            <Text style={styles.rewardMain}>{selectedConfig.title}</Text>
            <Text style={styles.rewardSub}>
              {formatCurrency(parsedAmount, currency)} · XP {formatMultiplier(multipliers.xpMultiplier)} · Itens {formatMultiplier(multipliers.itemDropMultiplier)}
            </Text>
          </View>
          <MaterialCommunityIcons name={selectedConfig.icon} size={30} color="#FFD166" />
        </View>
        <DropPreview amount={currency === 'USD' ? parsedAmount * USD_BRL_RATE : parsedAmount} multiplier={multipliers.itemDropMultiplier} />
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        <PrimaryButton icon="creation" tone="amber" onPress={onValidate}>
          Validar registro
        </PrimaryButton>
      </View>
    </View>
  );
}

function EquipmentSlot({ slot, item }) {
  const rarity = item ? getRarityMeta(item.rarity) : null;
  const accent = item ? rarity.color : '#475569';
  const iconName = item?.icon || SLOT_ICON_MAP[slot.key] || 'rhombus-outline';

  return (
    <View style={[styles.equipmentSlot, item && { borderColor: `${rarity.color}99`, backgroundColor: `${rarity.aura}16` }]}>
      <LinearGradient
        colors={item ? [`${rarity.aura}44`, '#111827'] : ['#111827', '#0B1118']}
        style={[styles.slotIcon, { borderColor: `${accent}66` }]}
      >
        <MaterialCommunityIcons name={iconName} size={23} color={item ? rarity.color : '#64748B'} />
      </LinearGradient>
      <View style={styles.slotTextWrap}>
        <Text style={styles.slotLabel}>{slot.label}</Text>
        <Text style={styles.slotItem} numberOfLines={item ? 3 : 1}>
          {item?.name || 'Vazio'}
        </Text>
        <Text style={[styles.slotRarity, item && { color: rarity.color }]} numberOfLines={2}>
          {item ? `${rarity.label} · Poder ${item.power}` : slot.description}
        </Text>
      </View>
    </View>
  );
}

function ItemCard({ item, equipped, onEquip }) {
  const rarity = getRarityMeta(item.rarity);

  return (
    <View style={[styles.itemCard, { borderColor: `${rarity.color}77` }]}>
      <View style={styles.itemCardTop}>
        <LinearGradient colors={[`${rarity.aura}40`, '#111827']} style={[styles.itemIcon, { borderColor: `${rarity.color}55` }]}>
          <MaterialCommunityIcons name={item.icon} size={25} color={rarity.color} />
        </LinearGradient>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemSetName, { color: rarity.color }]}>{item.setName}</Text>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemFlavor}>{item.flavor}</Text>
        </View>
      </View>
      <View style={styles.itemMetaRow}>
        <RarityPill rarity={item.rarity} />
        <Text style={styles.itemPower}>Poder {item.power}</Text>
        <Text style={styles.itemPower}>{item.bonusLabel}</Text>
      </View>
      <Text style={styles.itemLore}>{item.lore}</Text>
      <PrimaryButton icon={equipped ? 'shield-check' : 'shield-plus'} compact disabled={equipped} onPress={() => onEquip(item.id)}>
        {equipped ? 'Equipado' : 'Equipar'}
      </PrimaryButton>
    </View>
  );
}

function InventoryView({ state, multipliers, onEquip }) {
  const ownedItems = getOwnedItems(state.inventory).sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0) || b.power - a.power);
  const equippedIds = new Set(Object.values(state.equipment).filter(Boolean));
  const activeSets = getActiveSetBonuses(state.equipment);

  return (
    <View style={styles.screenStack}>
      <View style={styles.panel}>
        <SectionHeader eyebrow="Arsenal financeiro" title="Equipamentos da carteira" />
        <View style={styles.buildStats}>
          <StatTile icon="star-four-points" label="XP" value={formatMultiplier(multipliers.xpMultiplier)} color="#FFD166" />
          <StatTile icon="dice-multiple" label="Itens" value={formatMultiplier(multipliers.itemDropMultiplier)} color="#FF6B5F" />
        </View>
        <View style={styles.equipmentGrid}>
          {SLOT_ORDER.map((slot) => (
            <EquipmentSlot key={slot.key} slot={slot} item={ITEM_MAP[state.equipment[slot.key]]} />
          ))}
        </View>
        {activeSets.length ? (
          <View style={styles.setList}>
            {activeSets.map((bonus) => (
              <Text key={`${bonus.setName}-${bonus.pieces}`} style={styles.setLine}>
                {bonus.setName}: {bonus.label}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Equipe itens do mesmo conjunto para ativar bônus de ordem, conclave ou círculo.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <SectionHeader eyebrow="Mochila de investimentos" title={`${ownedItems.length} equipamento(s)`} />
        {ownedItems.length ? (
          <View style={styles.inventoryList}>
            {ownedItems.map((item) => (
              <ItemCard key={item.id} item={item} equipped={equippedIds.has(item.id)} onEquip={onEquip} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Valide um aporte para receber o primeiro item. A raridade depende do valor investido e do conjunto equipado.</Text>
        )}
      </View>
    </View>
  );
}

function getChartColor(key, index = 0) {
  return CATEGORY_COLORS[key] || CHART_COLORS[index % CHART_COLORS.length];
}

function ChartModeButton({ label, active, onPress, testID }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={[styles.chartModeButton, active && styles.chartModeButtonActive]}>
      <Text style={[styles.chartModeText, active && styles.chartModeTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChartMetric({ label, value, color }) {
  return (
    <View style={styles.chartMetric}>
      <View style={[styles.chartMetricDot, { backgroundColor: color }]} />
      <Text style={styles.chartMetricLabel}>{label}</Text>
      <Text style={styles.chartMetricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function EmptyChartState() {
  return (
    <View style={styles.emptyChart}>
      <MaterialCommunityIcons name="chart-timeline-variant" size={28} color="#64748B" />
      <Text style={styles.emptyText}>Registre aportes para liberar gráficos da carteira.</Text>
    </View>
  );
}

function EvolutionChart({ timeline }) {
  if (!timeline.length) {
    return <EmptyChartState />;
  }

  const points = timeline.slice(-7);
  const maxValue = Math.max(...points.map((point) => point.cumulativeAmount), 1);

  return (
    <View style={styles.evolutionChart}>
      <View style={styles.evolutionGrid}>
        {[0, 1, 2].map((line) => (
          <View key={line} style={styles.evolutionGridLine} />
        ))}
      </View>
      <View style={styles.evolutionBars}>
        {points.map((point, index) => {
          const height = Math.max(8, Math.round((point.cumulativeAmount / maxValue) * 100));
          const color = CHART_COLORS[index % CHART_COLORS.length];
          return (
            <View key={point.id} style={styles.evolutionColumn}>
              <View style={styles.evolutionTrack}>
                <View style={[styles.evolutionBar, { height: `${height}%`, backgroundColor: color }]} />
                <View style={[styles.evolutionDot, { borderColor: color }]} />
              </View>
              <Text style={styles.evolutionLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SegmentedAllocation({ entries }) {
  if (!entries.length) {
    return <EmptyChartState />;
  }

  return (
    <View style={styles.allocationStack}>
      <View style={styles.segmentedTrack}>
        {entries.map((entry, index) => (
          <View
            key={entry.key}
            style={[
              styles.segmentedPart,
              {
                flex: Math.max(0.04, entry.percentage),
                backgroundColor: getChartColor(entry.key, index),
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legendList}>
        {entries.map((entry, index) => {
          const color = getChartColor(entry.key, index);
          return (
            <View key={entry.key} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{entry.label}</Text>
              <Text style={styles.legendValue}>{formatPercent(entry.percentage)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TypeBars({ types }) {
  if (!types.length) {
    return null;
  }

  const maxAmount = Math.max(...types.map((entry) => entry.amount), 1);

  return (
    <View style={styles.typeBars}>
      {types.slice(0, 5).map((entry, index) => {
        const color = getChartColor(entry.category, index);
        const width = Math.max(8, Math.round((entry.amount / maxAmount) * 100));
        return (
          <View key={entry.key} style={styles.typeBarRow}>
            <View style={styles.typeBarHeader}>
              <View style={styles.typeBarTitle}>
                <MaterialCommunityIcons name={entry.icon} size={15} color={color} />
                <Text style={styles.typeBarLabel}>{entry.label}</Text>
              </View>
              <Text style={styles.typeBarValue}>{formatCurrency(entry.amount)}</Text>
            </View>
            <View style={styles.typeBarTrack}>
              <View style={[styles.typeBarFill, { width: `${width}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RiskBars({ risk }) {
  return (
    <View style={styles.typeBars}>
      {risk.map((entry) => {
        const color = RISK_COLORS[entry.key] || '#F5C64F';
        return (
          <View key={entry.key} style={styles.typeBarRow}>
            <View style={styles.typeBarHeader}>
              <Text style={styles.typeBarLabel}>Risco {entry.label}</Text>
              <Text style={styles.typeBarValue}>{formatCurrency(entry.amount)}</Text>
            </View>
            <View style={styles.typeBarTrack}>
              <View style={[styles.typeBarFill, { width: `${Math.max(4, Math.round(entry.percentage * 100))}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RiskMap({ types }) {
  if (!types.length) {
    return <EmptyChartState />;
  }

  const riskX = { low: 16, medium: 50, high: 84 };

  return (
    <View style={styles.riskMap}>
      <View style={styles.riskMapAxisVertical} />
      <View style={styles.riskMapAxisHorizontal} />
      <Text style={[styles.riskMapLabel, styles.riskMapLabelTop]}>Maior peso</Text>
      <Text style={[styles.riskMapLabel, styles.riskMapLabelLeft]}>Baixo risco</Text>
      <Text style={[styles.riskMapLabel, styles.riskMapLabelRight]}>Alto risco</Text>
      {types.slice(0, 6).map((entry, index) => {
        const color = getChartColor(entry.category, index);
        const size = Math.min(32, Math.max(16, 16 + entry.percentage * 34));
        const bottom = Math.min(82, Math.max(16, 18 + entry.percentage * 125));
        return (
          <View
            key={entry.key}
            style={[
              styles.riskBubble,
              {
                left: `${riskX[entry.riskTone] || 50}%`,
                bottom: `${bottom}%`,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: `${color}DD`,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function ScoreRow({ label, value, color }) {
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreTop}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{value}%</Text>
      </View>
      <ProgressBar value={value / 100} color={color} />
    </View>
  );
}

function PortfolioCharts({ history, summary }) {
  const [mode, setMode] = useState('overview');
  const analytics = useMemo(() => buildPortfolioAnalytics(history), [history]);
  const modes = [
    { key: 'overview', label: 'Visão' },
    { key: 'allocation', label: 'Alocação' },
    { key: 'risk', label: 'Risco' },
  ];

  return (
    <View style={styles.panel}>
      <SectionHeader eyebrow="Carteira" title="Análise visual" />
      <Text style={styles.helperText}>
        Gráficos baseados nos aportes validados. Use a leitura como estudo de composição, não como recomendação.
      </Text>

      <View style={styles.chartModes}>
        {modes.map((entry) => (
          <ChartModeButton key={entry.key} label={entry.label} active={mode === entry.key} onPress={() => setMode(entry.key)} testID={`chart-mode-${entry.key}`} />
        ))}
      </View>

      {mode === 'overview' ? (
        <View style={styles.chartStack}>
          <View style={styles.chartMetricRow}>
            <ChartMetric label="Patrimônio" value={formatCurrency(summary.totalAmount)} color="#34D399" />
            <ChartMetric label="Diversificação" value={`${analytics.diversificationScore}%`} color="#5AC8FA" />
          </View>
          <Text style={styles.chartTitle}>Evolução acumulada</Text>
          <EvolutionChart timeline={analytics.timeline} />
          <View style={styles.monthBars}>
            {analytics.monthly.slice(-6).map((entry, index) => (
              <View key={entry.key} style={styles.monthColumn}>
                <View style={styles.monthTrack}>
                  <View style={[styles.monthFill, { height: `${Math.max(6, Math.round(entry.percentage * 100))}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                </View>
                <Text style={styles.monthLabel}>{entry.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : mode === 'allocation' ? (
        <View style={styles.chartStack}>
          <View style={styles.chartMetricRow}>
            <ChartMetric label="Classes" value={String(analytics.categories.length)} color="#34D399" />
            <ChartMetric label="Produtos" value={String(analytics.types.length)} color="#FFD166" />
          </View>
          <Text style={styles.chartTitle}>Distribuição por classe</Text>
          <SegmentedAllocation entries={analytics.categories} />
          <Text style={styles.chartTitle}>Maiores posições</Text>
          <TypeBars types={analytics.types} />
        </View>
      ) : (
        <View style={styles.chartStack}>
          <View style={styles.chartMetricRow}>
            <ChartMetric label="Risco" value={`${analytics.riskScore}%`} color="#FB7185" />
            <ChartMetric label="Concentração" value={`${analytics.concentrationScore}%`} color="#F5C64F" />
          </View>
          <Text style={styles.chartTitle}>Mapa risco x peso</Text>
          <RiskMap types={analytics.types} />
          <Text style={styles.chartTitle}>Exposição por risco</Text>
          <RiskBars risk={analytics.risk} />
          <ScoreRow label="Diversificação" value={analytics.diversificationScore} color="#5AC8FA" />
          <ScoreRow label="Concentração" value={analytics.concentrationScore} color="#F5C64F" />
          <ScoreRow label="Risco estimado" value={analytics.riskScore} color="#FB7185" />
        </View>
      )}

      <View style={styles.insightBox}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#FFD166" />
        <Text style={styles.insightText}>{analytics.insight}</Text>
      </View>
    </View>
  );
}

function ProfileView({ state, summary, power, levelState, onExportCsv }) {
  const race = CHARACTER_RACES.find((entry) => entry.key === state.player.race) || CHARACTER_RACES[0];
  const characterClass = CHARACTER_CLASSES.find((entry) => entry.key === state.player.classKey) || CHARACTER_CLASSES[0];
  const recentHistory = state.history.slice(0, 5);

  return (
    <View style={styles.screenStack}>
      <View style={styles.panel}>
        <SectionHeader eyebrow="Perfil" title="Perfil financeiro" />
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <MaterialCommunityIcons name="account-circle" size={50} color="#10B981" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{state.player.name}</Text>
            <Text style={styles.profileLine}>{race.label}</Text>
            <Text style={styles.profileLine}>{characterClass.label}</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <StatTile icon="star" label="Nível" value={String(levelState.level)} color="#FFD166" />
          <StatTile icon="chart-areaspline" label="XP" value={formatCompact(levelState.totalXp)} color="#10B981" />
          <StatTile icon="arm-flex" label="Poder" value={formatCompact(power.total)} color="#5AC8FA" />
          <StatTile icon="cash" label="Aportes" value={String(summary.count)} color="#FF8A9A" />
        </View>
      </View>

      <PortfolioCharts history={state.history} summary={summary} />

      <View style={styles.panel}>
        <SectionHeader eyebrow="Relatório" title="Histórico validado" right={<GhostButton compact icon="file-delimited" onPress={onExportCsv}>CSV</GhostButton>} />
        {recentHistory.length ? (
          <View style={styles.historyList}>
            {recentHistory.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <MaterialCommunityIcons name={getTypeConfig(entry.typeKey).icon} size={20} color="#34D399" />
                </View>
                <View style={styles.historyText}>
                  <Text style={styles.historyTitle}>{entry.typeTitle}</Text>
                  <Text style={styles.historyMeta}>
                    {formatCurrency(entry.amount)} · +{entry.xpGranted} XP · {entry.hash}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Sem histórico por enquanto.</Text>
        )}
      </View>
    </View>
  );
}

export default function MobileApp() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState('inicio');
  const [amountInput, setAmountInput] = useState('0,00');
  const [currency, setCurrency] = useState('BRL');
  const [selectedCategory, setSelectedCategory] = useState(INVESTMENT_CATEGORIES[0].key);
  const [selectedType, setSelectedType] = useState(getInvestmentTypesByCategory(INVESTMENT_CATEGORIES[0].key)[0]?.key || 'tesouro-selic');
  const [ocrText, setOcrText] = useState('');
  const [ocrResult, setOcrResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [magicEvent, setMagicEvent] = useState(null);

  const summary = useMemo(() => getHistorySummary(state.history), [state.history]);
  const power = useMemo(() => calculateProfilePower(state.equipment, state.history), [state.equipment, state.history]);
  const levelState = useMemo(() => getLevelState(summary.totalXp), [summary.totalXp]);
  const multipliers = useMemo(() => getEquipmentMultipliers(state.equipment), [state.equipment]);
  const quests = useMemo(
    () => getQuestStatuses({ history: state.history, summary, power, equipment: state.equipment, inventory: state.inventory, exportCount: state.meta.exportCount }),
    [power, state.equipment, state.history, state.inventory, state.meta.exportCount, summary],
  );
  const achievements = useMemo(
    () => getAchievementStatuses({ history: state.history, summary, power, equipment: state.equipment, inventory: state.inventory, exportCount: state.meta.exportCount }),
    [power, state.equipment, state.history, state.inventory, state.meta.exportCount, summary],
  );

  useEffect(() => {
    if (!magicEvent) {
      return undefined;
    }

    const timeout = setTimeout(() => setMagicEvent(null), 2300);
    return () => clearTimeout(timeout);
  }, [magicEvent]);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [tab]);

  function commitState(nextState) {
    const withUpdate = {
      ...nextState,
      meta: {
        ...nextState.meta,
        updatedAt: new Date().toISOString(),
      },
    };
    setState(withUpdate);
    persistState(withUpdate);
  }

  function showMagic(event) {
    setMagicEvent({ id: `${Date.now()}-${event.title}`, ...event });
  }

  function handleCreate(player) {
    const now = new Date().toISOString();
    commitState(
      createInitialGameState({
        ...state,
        meta: {
          ...state.meta,
          characterCreated: true,
          createdAt: state.meta.createdAt || now,
          updatedAt: now,
        },
        player: {
          ...state.player,
          ...player,
        },
      }),
    );
  }

  function handleAnalyzeOcr() {
    const result = analyzeOcrText(ocrText);
    setOcrResult(result);
    setCurrency(result.currency);
    setSelectedCategory(result.category);
    setSelectedType(result.typeKey);

    if (result.amount > 0 && parseCurrencyInput(amountInput) === 0) {
      setAmountInput(String(result.amount).replace('.', ','));
    }

    setNotice(result.summary);
  }

  function handleValidate() {
    const analysis = analyzeInvestmentPayload({
      transcript: ocrText,
      manualAmount: amountInput,
      typeKey: selectedType,
      currency,
      equipment: state.equipment,
      exchangeRates: { usdBrl: USD_BRL_RATE },
      now: new Date(),
    });

    if (!analysis.amount || analysis.amount <= 0) {
      setNotice('Informe uma quantia válida antes de validar o registro.');
      return;
    }

    const beforeLevel = getLevelState(summary.totalXp).level;
    const hash = shortHash(`${state.player.name}-${analysis.typeKey}-${analysis.amount}-${analysis.createdAt}-${ocrText}`);
    const roll = rollItemDrops({
      typeKey: analysis.typeKey,
      amount: analysis.amount,
      inventory: state.inventory,
      equipment: state.equipment,
      seed: hash,
    });
    const droppedItems = roll.drops.map((item) => ({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      power: item.power,
    }));
    const record = {
      id: `registro-${hash}`,
      proofName: ocrText ? 'ocr-assistido.txt' : 'entrada-guiada',
      hash,
      ...analysis,
      droppedItems,
      dropChances: roll.chances,
    };
    const inventory = [...new Set([...state.inventory, ...roll.drops.map((item) => item.id)])];
    let nextState = {
      ...state,
      history: [record, ...state.history],
      inventory,
      wallet: {
        coins: Number(state.wallet.coins || 0) + Math.max(10, Math.round(analysis.xpGranted / 8)),
        crystals: Number(state.wallet.crystals || 0) + roll.drops.filter((item) => item.rarity === 'lendario' || item.rarity === 'artefato').length,
      },
      meta: {
        ...state.meta,
        duplicateDrops: Number(state.meta.duplicateDrops || 0) + roll.duplicateCount,
      },
    };

    nextState = autoEquipBestDrops(nextState, roll.drops);
    commitState(nextState);

    const afterLevel = getLevelState(getHistorySummary(nextState.history).totalXp).level;
    const bestDrop = getBestDrop(roll.drops);
    const subtitle = bestDrop
      ? `${bestDrop.name} entrou no arsenal.`
      : roll.duplicateCount
        ? 'Item repetido virou progresso de coleção.'
        : `+${analysis.xpGranted} XP adicionados.`;

    showMagic({
      type: afterLevel > beforeLevel ? 'level' : 'drop',
      rarity: bestDrop?.rarity || 'raro',
      title: afterLevel > beforeLevel ? `Nível ${afterLevel}!` : bestDrop ? 'Equipamento obtido!' : 'Registro validado',
      subtitle,
    });

    setNotice(`Registro validado: ${analysis.typeTitle}, ${formatCurrency(analysis.amount)}, +${analysis.xpGranted} XP.`);
    setOcrResult(null);
  }

  function handleEquip(itemId) {
    const item = ITEM_MAP[itemId];
    commitState(equipItem(state, itemId));
    showMagic({
      type: 'equip',
      rarity: item?.rarity || 'comum',
      title: 'Conceito equipado',
      subtitle: item ? `${item.name} ajustou seus multiplicadores.` : 'A seleção foi atualizada.',
    });
  }

  function handleExportCsv() {
    const csv = buildCsv(state.history);
    commitState({
      ...state,
      meta: {
        ...state.meta,
        exportCount: Number(state.meta.exportCount || 0) + 1,
        lastCsvPreview: csv.slice(0, 240),
      },
    });
    setNotice(`CSV preparado com ${state.history.length} registro(s).`);
  }

  if (!state.meta.characterCreated) {
    return <CreationScreen onCreate={handleCreate} />;
  }

  const content =
    tab === 'aprender' ? (
      <LearnView selectedType={selectedType} setSelectedType={setSelectedType} quests={quests} />
    ) : tab === 'validacao' ? (
      <ValidationView
        amountInput={amountInput}
        setAmountInput={setAmountInput}
        currency={currency}
        setCurrency={setCurrency}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        ocrText={ocrText}
        setOcrText={setOcrText}
        ocrResult={ocrResult}
        setOcrResult={setOcrResult}
        notice={notice}
        multipliers={multipliers}
        onAnalyzeOcr={handleAnalyzeOcr}
        onValidate={handleValidate}
      />
    ) : tab === 'inventario' ? (
      <InventoryView state={state} multipliers={multipliers} onEquip={handleEquip} />
    ) : tab === 'perfil' ? (
      <ProfileView state={state} summary={summary} power={power} levelState={levelState} onExportCsv={handleExportCsv} />
    ) : (
      <HomeView state={state} summary={summary} power={power} levelState={levelState} multipliers={multipliers} setTab={setTab} />
    );

  return (
    <LinearGradient colors={['#020409', '#070A12', '#0B111C']} style={styles.appRoot}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.mobileShell, width >= 520 && styles.mobileShellWide]}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
        <View style={styles.bottomNav}>
          {TABS.map((entry) => (
            <TabButton key={entry.key} tab={entry} active={tab === entry.key} onPress={() => setTab(entry.key)} />
          ))}
        </View>
      </View>
      <MagicBurst event={magicEvent} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    minHeight: '100%',
  },
  mobileShell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  mobileShellWide: {
    maxWidth: 520,
  },
  scrollContent: {
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  screenStack: {
    gap: 14,
  },
  creation: {
    flex: 1,
    minHeight: '100%',
  },
  creationContent: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 42,
  },
  creationHero: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  logoCrest: {
    width: 92,
    height: 92,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    gap: 2,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  appName: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  creationSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 360,
  },
  heroPanel: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrowLight: {
    color: '#9EECD8',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  heroCopy: {
    color: '#D8E7F3',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  levelBadge: {
    width: 70,
    minHeight: 70,
    borderRadius: 18,
    backgroundColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  levelLabel: {
    color: '#3B2B02',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  levelNumber: {
    color: '#102E29',
    fontSize: 28,
    fontWeight: '900',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  xpLabel: {
    color: '#ECF7FF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  panel: {
    backgroundColor: '#0B1118',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionHeaderText: {
    flex: 1,
  },
  eyebrow: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 2,
  },
  helperText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    padding: 12,
    justifyContent: 'space-between',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    backgroundColor: '#172033',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  inputLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#090E15',
    color: '#F8FAFC',
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 15,
  },
  amountRow: {
    gap: 10,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#090E15',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  amountCurrencyPrefix: {
    color: '#34D399',
    fontSize: 22,
    fontWeight: '900',
  },
  amountInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    padding: 0,
  },
  currencyGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionStack: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    padding: 12,
  },
  optionRowActive: {
    backgroundColor: '#0F766E',
    borderColor: '#34D399',
  },
  optionTextWrap: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  optionTitleActive: {
    color: '#FFFFFF',
  },
  optionText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  optionTextActive: {
    color: '#D1FAE5',
  },
  buttonWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
  },
  buttonCompact: {
    flexGrow: 0,
    minWidth: 132,
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.45,
  },
  ghostButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  ghostButtonCompact: {
    minHeight: 38,
    paddingHorizontal: 10,
  },
  ghostButtonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  choiceChip: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    flexGrow: 1,
    flexBasis: '45%',
  },
  choiceChipCompact: {
    minHeight: 40,
    flexBasis: 0,
  },
  choiceChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#34D399',
  },
  choiceText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeList: {
    gap: 9,
  },
  typeOption: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    padding: 11,
    gap: 8,
  },
  typeOptionActive: {
    backgroundColor: '#0F766E',
    borderColor: '#34D399',
  },
  typeLeft: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  typeTextWrap: {
    flex: 1,
    gap: 3,
  },
  typeTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  typeTitleActive: {
    color: '#FFFFFF',
  },
  typeLearning: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  typeLearningActive: {
    color: '#D1FAE5',
  },
  typeXp: {
    color: '#FFD166',
    fontSize: 12,
    fontWeight: '900',
    alignSelf: 'flex-end',
  },
  typeXpActive: {
    color: '#FFFFFF',
  },
  ocrInput: {
    minHeight: 104,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ocrResult: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    padding: 11,
  },
  ocrResultText: {
    flex: 1,
    gap: 3,
  },
  ocrSummary: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  ocrMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  rewardPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    padding: 12,
  },
  rewardMain: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
  },
  rewardSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },
  dropPreview: {
    gap: 8,
  },
  dropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropName: {
    width: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },
  dropTrack: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: '#172033',
  },
  dropFill: {
    height: '100%',
    borderRadius: 99,
  },
  dropChance: {
    width: 38,
    color: '#F8FAFC',
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '900',
  },
  noticeText: {
    color: '#FFD166',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  itemMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  itemMini: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#111827',
    padding: 10,
    gap: 8,
  },
  itemMiniName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  latestBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  latestValue: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
  },
  latestMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
  missionCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    padding: 12,
  },
  missionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#172033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIconDone: {
    backgroundColor: '#0F766E',
  },
  missionBody: {
    flex: 1,
    gap: 7,
  },
  missionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  missionTitle: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  missionCount: {
    color: '#B7791F',
    fontSize: 12,
    fontWeight: '900',
  },
  missionText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  rewardText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  listStack: {
    gap: 10,
  },
  rarityPill: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  riskBadge: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoLine: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingVertical: 9,
  },
  infoLineText: {
    flex: 1,
    gap: 2,
  },
  infoLineLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoLineValue: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  educationCard: {
    backgroundColor: '#0B1118',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  educationInline: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  educationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  educationTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  educationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#063E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  educationNameWrap: {
    flex: 1,
  },
  educationTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
  },
  educationTitleCompact: {
    color: '#F8FAFC',
  },
  educationCategory: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  educationCategoryCompact: {
    color: '#94A3B8',
  },
  educationSummary: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  educationSummaryCompact: {
    color: '#CBD5E1',
  },
  infoGrid: {
    gap: 8,
  },
  educationSubTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  compactRiskBox: {
    borderRadius: 12,
    backgroundColor: '#2A1F06',
    borderWidth: 1,
    borderColor: '#A16207',
    padding: 10,
  },
  compactRiskText: {
    color: '#FDE68A',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  compactMetaText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  learnTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusGrid: {
    gap: 8,
  },
  sourceList: {
    gap: 10,
  },
  sourceRow: {
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#263241',
    padding: 10,
    gap: 3,
  },
  sourceLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
  },
  sourceFocus: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  buildStats: {
    flexDirection: 'row',
    gap: 10,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  equipmentSlot: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 112,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: '#111827',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  slotIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTextWrap: {
    flex: 1,
  },
  slotLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  slotItem: {
    color: '#F8FAFC',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  slotRarity: {
    color: '#7E93A7',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  setList: {
    gap: 5,
  },
  setLine: {
    color: '#34D399',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  inventoryList: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#111827',
    padding: 12,
    gap: 10,
  },
  itemCardTop: {
    flexDirection: 'row',
    gap: 10,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    color: '#F8FAFC',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  itemSetName: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  itemFlavor: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  itemPower: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  itemLore: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  chartModes: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#090E15',
    borderRadius: 14,
    padding: 4,
  },
  chartModeButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartModeButtonActive: {
    backgroundColor: '#0F766E',
  },
  chartModeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '900',
  },
  chartModeTextActive: {
    color: '#FFFFFF',
  },
  chartStack: {
    gap: 12,
  },
  chartMetricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chartMetric: {
    flex: 1,
    minHeight: 74,
    borderRadius: 14,
    backgroundColor: '#090E15',
    padding: 11,
    gap: 4,
  },
  chartMetricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartMetricLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  chartMetricValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  chartTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyChart: {
    minHeight: 156,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#090E15',
    borderRadius: 14,
    padding: 16,
  },
  evolutionChart: {
    height: 170,
    borderRadius: 14,
    backgroundColor: '#090E15',
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  evolutionGrid: {
    position: 'absolute',
    top: 16,
    right: 10,
    bottom: 32,
    left: 10,
    justifyContent: 'space-between',
  },
  evolutionGridLine: {
    height: 1,
    backgroundColor: '#1F2937',
  },
  evolutionBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  evolutionColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    gap: 6,
  },
  evolutionTrack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  evolutionBar: {
    width: '58%',
    borderRadius: 99,
  },
  evolutionDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: '#090E15',
  },
  evolutionLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  monthBars: {
    minHeight: 78,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  monthColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  monthTrack: {
    height: 54,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#090E15',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  monthFill: {
    width: '100%',
    borderRadius: 10,
  },
  monthLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  allocationStack: {
    gap: 10,
  },
  segmentedTrack: {
    height: 22,
    flexDirection: 'row',
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: '#090E15',
  },
  segmentedPart: {
    minWidth: 5,
  },
  legendList: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },
  legendValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '900',
  },
  typeBars: {
    gap: 10,
  },
  typeBarRow: {
    gap: 7,
  },
  typeBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  typeBarTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  typeBarLabel: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },
  typeBarValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '900',
  },
  typeBarTrack: {
    height: 9,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: '#172033',
  },
  typeBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  riskMap: {
    height: 176,
    borderRadius: 14,
    backgroundColor: '#090E15',
    borderWidth: 1,
    borderColor: '#1F2937',
    overflow: 'hidden',
  },
  riskMapAxisVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: '#1F2937',
  },
  riskMapAxisHorizontal: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: '50%',
    height: 1,
    backgroundColor: '#1F2937',
  },
  riskMapLabel: {
    position: 'absolute',
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  riskMapLabelTop: {
    top: 8,
    left: 10,
  },
  riskMapLabelBottom: {
    bottom: 8,
    left: 10,
  },
  riskMapLabelLeft: {
    bottom: 8,
    left: 10,
  },
  riskMapLabelRight: {
    bottom: 8,
    right: 10,
  },
  riskBubble: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#090E15',
    transform: [{ translateX: -10 }, { translateY: 10 }],
  },
  scoreRow: {
    gap: 6,
  },
  scoreTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },
  scoreValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '900',
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 14,
    backgroundColor: '#171307',
    padding: 11,
  },
  insightText: {
    flex: 1,
    color: '#FDE68A',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#263241',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
  },
  profileLine: {
    color: '#94A3B8',
    fontSize: 13,
  },
  historyList: {
    gap: 9,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#263241',
    padding: 11,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#172033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    flex: 1,
  },
  historyTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  historyMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },
  bottomNav: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 12,
    minHeight: 68,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#263241',
    backgroundColor: 'rgba(11, 17, 24, 0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  tabButton: {
    flex: 1,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabButtonActive: {
    backgroundColor: '#0F766E',
  },
  tabLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  magicOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.54)',
    paddingHorizontal: 26,
  },
  magicCard: {
    width: '100%',
    maxWidth: 330,
    minHeight: 220,
    borderRadius: 28,
    borderWidth: 2,
    backgroundColor: '#0B1118',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    gap: 10,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  magicIcon: {
    width: 78,
    height: 78,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magicParticle: {
    position: 'absolute',
    width: 8,
    height: 24,
    borderRadius: 99,
  },
  magicTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  magicSubtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
