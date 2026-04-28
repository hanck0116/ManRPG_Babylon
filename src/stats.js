(function initStats(global) {
  const DEFAULT_BASE_STATS = {
    strength: 10,
    agility: 10,
    vitality: 10,
    intelligence: 10,
    wisdom: 10,
    luck: 10,
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

  function createGrowthModel() {
    const state = {
      baseStats: { ...DEFAULT_BASE_STATS },
      temporaryBonuses: {
        maxHpFlat: 0,
        maxMpFlat: 0,
        attackDamageFlat: 0,
        magicDamageFlat: 0,
        moveSpeedFlat: 0,
        dodgeDistanceFlat: 0,
        guardReductionFlat: 0,
        mpRegenFlat: 0,
        maxHpMultiplier: 1,
        maxMpMultiplier: 1,
        mpRegenMultiplier: 1,
      },
      rewardBonuses: {
        maxHpFlat: 0,
        maxMpFlat: 0,
        attackDamageFlat: 0,
        magicDamageFlat: 0,
        moveSpeedFlat: 0,
        dodgeDistanceFlat: 0,
        guardReductionFlat: 0,
        mpRegenFlat: 0,
      },
      derivedStats: {},
    };

    function recalculate(swordStage = 0) {
      const s = state.baseStats;
      const t = state.temporaryBonuses;
      const r = state.rewardBonuses;
      const sword = SWORD_STAGE_DATA[swordStage] || SWORD_STAGE_DATA[0];

      const baseMaxHp = 100 + s.vitality * 8 + t.maxHpFlat + r.maxHpFlat;
      const baseMaxMp = 100 + s.intelligence * 5 + t.maxMpFlat + r.maxMpFlat;
      const baseAttack = 8 + s.strength * 1.6 + t.attackDamageFlat + r.attackDamageFlat;
      const baseMpRegen = 0.8 + s.wisdom * 0.08 + t.mpRegenFlat + r.mpRegenFlat;

      state.derivedStats = {
        maxHp: baseMaxHp * t.maxHpMultiplier,
        maxMp: Math.max(0, baseMaxMp * t.maxMpMultiplier - sword.mpPenalty),
        attackDamage: baseAttack * sword.attackMultiplier,
        magicDamage: 10 + s.intelligence * 1.2 + t.magicDamageFlat + r.magicDamageFlat,
        moveSpeed: 3.5 + s.agility * 0.08 + t.moveSpeedFlat + r.moveSpeedFlat,
        dodgeDistance: 2.2 + s.agility * 0.03 + t.dodgeDistanceFlat + r.dodgeDistanceFlat,
        guardReduction: Math.min(0.9, 0.25 + s.wisdom * 0.004 + t.guardReductionFlat + r.guardReductionFlat),
        mpRegen: baseMpRegen * t.mpRegenMultiplier,
        critChance: Math.max(0.05, Math.min(0.6, 0.05 + s.luck * 0.004)),
        swordStageName: sword.name,
      };
      return state.derivedStats;
    }

    recalculate(0);
    return { state, recalculate };
  }

  global.createGrowthModel = createGrowthModel;
  global.SWORD_STAGE_DATA = SWORD_STAGE_DATA;
})(window);
