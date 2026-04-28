(function initDerivedStats(global) {
  function getSwordStageEffect(stage) {
    const table = {
      0: { name: "없음", mpPenalty: 0, attackMultiplier: 1 },
      1: { name: "검기상인", mpPenalty: 50, attackMultiplier: 1.2 },
      2: { name: "검기", mpPenalty: 100, attackMultiplier: 1.5 },
      3: { name: "검사", mpPenalty: 300, attackMultiplier: 3 },
      4: { name: "검강", mpPenalty: 500, attackMultiplier: 10 },
      5: { name: "강기압환", mpPenalty: 300, attackMultiplier: 50 },
      6: { name: "심검", mpPenalty: 0, attackMultiplier: 50 },
    };
    return table[stage] || table[0];
  }

  function getEffectiveStats(character) {
    const out = {};
    Object.keys(character.primaryStats).forEach((k) => {
      out[k] = character.primaryStats[k] + (character.bonusStats[k] || 0);
    });
    return out;
  }

  function recalculateDerivedStats(character, level, swordStage = 0) {
    character.effectiveStats = getEffectiveStats(character);
    const s = character.effectiveStats;
    const sword = getSwordStageEffect(swordStage);

    const baseMaxHp = s.vitality * 10;
    const baseMaxMp = level * 5 + s.intelligence * 10;
    const baseMpRegen = level + s.wisdom * 2;
    const baseAttack = Math.floor((s.strength + s.vitality) / 10) + 2;

    const externalMult = Math.pow(1.2, character.manualUses.external);
    const internalMult = Math.pow(1.1, character.manualUses.internal);

    character.officialDerivedStats = {
      maxHp: Math.floor(baseMaxHp * externalMult),
      maxMp: Math.max(0, Math.floor(baseMaxMp * internalMult - sword.mpPenalty)),
      mpRegen: Math.floor(baseMpRegen * internalMult),
      basicAttackDamage: Math.floor(baseAttack * sword.attackMultiplier),
      multiCastingCount: character.multiCastingCount || 1,
      magicDamage: 0,
      swordStageName: sword.name,
    };

    return character.officialDerivedStats;
  }

  function clampHpMp(character) {
    character.hp = Math.min(character.hp, character.officialDerivedStats.maxHp);
    character.mp = Math.min(character.mp, character.officialDerivedStats.maxMp);
    character.hp = Math.max(0, character.hp);
    character.mp = Math.max(0, character.mp);
  }

  function applyStatPoint(character, statName, level) {
    const cap = global.getStatCap(level);
    if (character.primaryStats[statName] >= cap) return false;
    character.primaryStats[statName] += 1;
    return true;
  }

  function applyExternalManual(character) {
    character.manualUses.external += 1;
  }
  function applyInternalManual(character) {
    character.manualUses.internal += 1;
  }
  function applySwordEnergyManual(character) {
    character.swordStage = Math.min(6, (character.swordStage || 0) + 1);
  }

  global.getSwordStageEffect = getSwordStageEffect;
  global.getEffectiveStats = getEffectiveStats;
  global.recalculateDerivedStats = recalculateDerivedStats;
  global.applyStatPoint = applyStatPoint;
  global.applyExternalManual = applyExternalManual;
  global.applyInternalManual = applyInternalManual;
  global.applySwordEnergyManual = applySwordEnergyManual;
  global.clampHpMp = clampHpMp;
})(window);
