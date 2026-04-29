(function initStats(global) {
  const DEFAULT_PRIMARY_STATS = {
    strength: 1,
    agility: 1,
    appearance: 1,
    intelligence: 1,
    vitality: 1,
    wisdom: 1,
  };

  const DEFAULT_BONUS_STATS = {
    strength: 0,
    agility: 0,
    appearance: 0,
    intelligence: 0,
    vitality: 0,
    wisdom: 0,
  };

  const SWORD_STAGE_DATA = {
    0: { name: "없음", mpPenalty: 0, attackMultiplier: 1 },
    1: { name: "검기상인", mpPenalty: 50, attackMultiplier: 1.2 },
    2: { name: "검기", mpPenalty: 100, attackMultiplier: 1.5 },
    3: { name: "검사", mpPenalty: 300, attackMultiplier: 3 },
    4: { name: "검강", mpPenalty: 500, attackMultiplier: 10 },
    5: { name: "강기압환", mpPenalty: 300, attackMultiplier: 50 },
    6: { name: "심검", mpPenalty: 0, attackMultiplier: 50 },
  };

  const DEFAULT_COMBAT_TUNING = {
    moveSpeed: 4.5,
    dodgeDistance: 2.6,
    dodgeInvincibleTime: 0.22,
    guardReduction: 0.4,
    attackCooldown: 0.32,
    magicCooldownScale: 0.03,
  };

  function getEffectiveStats(primaryStats, bonusStats) {
    const out = {};
    Object.keys(DEFAULT_PRIMARY_STATS).forEach((k) => {
      out[k] = (primaryStats[k] || 0) + (bonusStats[k] || 0);
    });
    return out;
  }

  function recalculateOfficialDerived(state, level = 1, swordStage = 0, externalUseCount = 0, internalUseCount = 0, multiCastingCount = 1) {
    const effective = getEffectiveStats(state.primaryStats, state.bonusStats);
    const sword = SWORD_STAGE_DATA[swordStage] || SWORD_STAGE_DATA[0];

    const baseMaxHp = effective.vitality * 10;
    const baseMaxMp = level * 5 + effective.intelligence * 10;
    const baseMpRegen = level + effective.wisdom * 2;
    const baseAttack = Math.floor((effective.strength + effective.vitality) / 10) + 2;

    const hpAfterManual = Math.floor(baseMaxHp * Math.pow(1.2, externalUseCount));
    const mpAfterInternal = Math.floor(baseMaxMp * Math.pow(1.1, internalUseCount));
    const mpRegenAfterInternal = Math.floor(baseMpRegen * Math.pow(1.1, internalUseCount));

    state.effectiveStats = effective;
    state.officialDerivedStats = {
      maxHp: hpAfterManual,
      maxMp: Math.max(0, mpAfterInternal - sword.mpPenalty),
      mpRegen: mpRegenAfterInternal,
      basicAttackDamage: Math.floor(baseAttack * sword.attackMultiplier),
      multiCastingCount: Math.max(1, multiCastingCount || 1),
      swordStageName: sword.name,
    };
    return state.officialDerivedStats;
  }

  function createGrowthModel() {
    const state = {
      primaryStats: { ...DEFAULT_PRIMARY_STATS },
      bonusStats: { ...DEFAULT_BONUS_STATS },
      effectiveStats: getEffectiveStats(DEFAULT_PRIMARY_STATS, DEFAULT_BONUS_STATS),
      officialDerivedStats: {
        maxHp: 10,
        maxMp: 15,
        mpRegen: 3,
        basicAttackDamage: 2,
        multiCastingCount: 1,
        swordStageName: "없음",
      },
      combatTuning: { ...DEFAULT_COMBAT_TUNING },
      baseStats: { ...DEFAULT_PRIMARY_STATS },
      derivedStats: {},
    };

    function recalculate(swordStage = 0, level = 1, manualUseCounts = { external: 0, internal: 0 }, multiCastingCount = 1) {
      state.primaryStats = { ...state.baseStats, ...(state.primaryStats || {}) };
      const out = recalculateOfficialDerived(state, level, swordStage, manualUseCounts.external || 0, manualUseCounts.internal || 0, multiCastingCount);
      state.derivedStats = {
        maxHp: out.maxHp,
        maxMp: out.maxMp,
        mpRegen: out.mpRegen,
        attackDamage: out.basicAttackDamage,
        swordStageName: out.swordStageName,
      };
      return { ...state.combatTuning, ...state.derivedStats, critChance: 0.05 };
    }

    recalculate(0, 1, { external: 0, internal: 0 }, 1);
    return { state, recalculate };
  }

  global.createGrowthModel = createGrowthModel;
  global.SWORD_STAGE_DATA = SWORD_STAGE_DATA;
  global.recalculateOfficialDerived = recalculateOfficialDerived;
  global.DEFAULT_PRIMARY_STATS = DEFAULT_PRIMARY_STATS;
  global.DEFAULT_BONUS_STATS = DEFAULT_BONUS_STATS;
})(window);
