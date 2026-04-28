(function initCharacterCreation(global) {
  const CHARACTER_CREATION_STEPS = ["name", "stats", "mantra", "originalMana", "lore", "confirm"];
  const STAT_KEYS = ["strength", "agility", "appearance", "intelligence", "vitality", "wisdom"];
  const STAT_LABELS = {
    strength: "힘",
    agility: "민첩",
    appearance: "외모",
    intelligence: "지능",
    vitality: "체력",
    wisdom: "지혜",
  };

  const mantraPresets = ["검", "신체 강화", "그림자", "지팡이", "인력", "야수", "망토", "피닉스", "악마", "천사", "인과의 눈", "무색유리검"];
  const manaPresets = ["불안정한 마나", "정제된 마나", "폭주하는 마나", "순환하는 마나", "침식하는 마나", "응축된 마나", "공명하는 마나"];

  function resetCharacterCreationForm() {
    return {
      stepIndex: 0,
      profile: {
        name: "",
        gender: "",
        worldDestructionCause: "",
        destroyer: "",
        finalMoment: "",
        goal: "",
      },
      statAllocation: {
        strength: 0,
        agility: 0,
        appearance: 0,
        intelligence: 0,
        vitality: 0,
        wisdom: 0,
      },
      mantra: { name: "", category: "", description: "" },
      originalMana: { name: "", type: "", description: "" },
    };
  }

  function validateCharacterName(form) {
    return !!form?.profile?.name?.trim();
  }

  function validateStatAllocation(form) {
    const values = STAT_KEYS.map((k) => form.statAllocation[k]);
    if (values.some((v) => !Number.isInteger(v) || v < 0)) return false;
    return values.reduce((a, b) => a + b, 0) === 54;
  }

  function computeOfficialDerived(stats, level = 1) {
    return {
      maxHp: stats.vitality * 10,
      maxMp: level * 5 + stats.intelligence * 10,
      mpRegen: level + stats.wisdom * 2,
      basicAttackDamage: Math.floor((stats.strength + stats.vitality) / 10) + 2,
      multiCastingCount: 1,
    };
  }

  function createPlayerFromCharacterForm(form) {
    const baseStats = {
      strength: 1 + form.statAllocation.strength,
      agility: 1 + form.statAllocation.agility,
      vitality: 1 + form.statAllocation.vitality,
      intelligence: 1 + form.statAllocation.intelligence,
      wisdom: 1 + form.statAllocation.wisdom,
      luck: 1 + form.statAllocation.appearance,
    };
    const officialPrimary = {
      strength: baseStats.strength,
      agility: baseStats.agility,
      vitality: baseStats.vitality,
      intelligence: baseStats.intelligence,
      wisdom: baseStats.wisdom,
      appearance: 1 + form.statAllocation.appearance,
    };
    const officialDerivedStats = computeOfficialDerived(officialPrimary, 1);

    return {
      profile: { ...form.profile },
      mantra: { ...form.mantra },
      originalMana: { ...form.originalMana },
      level: 1,
      floor: 1,
      coin: 0,
      statPoints: 0,
      baseStats,
      officialPrimary,
      officialDerivedStats,
      derivedStats: { ...officialDerivedStats },
      inventory: {
        externalManualCount: 0,
        internalManualCount: 0,
        swordEnergyCount: 0,
        spellBooks: [],
        grimoires: [],
      },
      skills: {},
      magicList: [],
      manuals: { external: 0, internal: 0, swordEnergy: 0 },
      swordStage: 0,
      hp: officialDerivedStats.maxHp,
      mp: officialDerivedStats.maxMp,
    };
  }

  function confirmCharacter(form) {
    if (!validateCharacterName(form)) return { ok: false, reason: "name" };
    if (!validateStatAllocation(form)) return { ok: false, reason: "stats" };
    if (!form.mantra.name.trim()) return { ok: false, reason: "mantra" };
    if (!form.originalMana.name.trim()) return { ok: false, reason: "mana" };
    if (!form.profile.worldDestructionCause.trim() || !form.profile.destroyer.trim() || !form.profile.finalMoment.trim() || !form.profile.goal.trim()) {
      return { ok: false, reason: "lore" };
    }
    return { ok: true };
  }

  global.CHARACTER_CREATION_STEPS = CHARACTER_CREATION_STEPS;
  global.CHARACTER_CREATION_STAT_KEYS = STAT_KEYS;
  global.CHARACTER_CREATION_STAT_LABELS = STAT_LABELS;
  global.MANTRA_PRESETS = mantraPresets;
  global.ORIGINAL_MANA_PRESETS = manaPresets;
  global.resetCharacterCreationForm = resetCharacterCreationForm;
  global.validateCharacterName = validateCharacterName;
  global.validateStatAllocation = validateStatAllocation;
  global.createPlayerFromCharacterForm = createPlayerFromCharacterForm;
  global.confirmCharacter = confirmCharacter;
})(window);
