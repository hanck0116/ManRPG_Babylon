(function initStats(global) {
  const DEFAULT_BASE_STATS = {
    strength: 10,
    agility: 10,
    vitality: 10,
    intelligence: 10,
    wisdom: 10,
    luck: 10,
  };

  function createGrowthModel() {
    const state = {
      baseStats: { ...DEFAULT_BASE_STATS },
      temporaryBonuses: {
        maxHp: 0,
        maxMp: 0,
        attackDamage: 0,
        magicDamage: 0,
        moveSpeed: 0,
        dodgeDistance: 0,
        guardReduction: 0,
        mpRegen: 0,
      },
      rewardBonuses: {
        maxHp: 0,
        maxMp: 0,
        attackDamage: 0,
        magicDamage: 0,
        moveSpeed: 0,
        dodgeDistance: 0,
        guardReduction: 0,
        mpRegen: 0,
      },
      derivedStats: {},
    };

    function recalculate() {
      const s = state.baseStats;
      const t = state.temporaryBonuses;
      const r = state.rewardBonuses;

      state.derivedStats = {
        maxHp: 100 + s.vitality * 8 + t.maxHp + r.maxHp,
        maxMp: 100 + s.intelligence * 5 + t.maxMp + r.maxMp,
        attackDamage: 8 + s.strength * 1.6 + t.attackDamage + r.attackDamage,
        magicDamage: 10 + s.intelligence * 1.2 + t.magicDamage + r.magicDamage,
        moveSpeed: 3.5 + s.agility * 0.08 + t.moveSpeed + r.moveSpeed,
        dodgeDistance: 2.2 + s.agility * 0.03 + t.dodgeDistance + r.dodgeDistance,
        guardReduction: Math.min(0.9, 0.25 + s.wisdom * 0.004 + t.guardReduction + r.guardReduction),
        mpRegen: 0.8 + s.wisdom * 0.08 + t.mpRegen + r.mpRegen,
        critChance: Math.max(0.05, Math.min(0.6, 0.05 + s.luck * 0.004)),
      };

      return state.derivedStats;
    }

    recalculate();

    return {
      state,
      recalculate,
    };
  }

  global.createGrowthModel = createGrowthModel;
})(window);
