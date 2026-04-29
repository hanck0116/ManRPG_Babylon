(function initSaveSystem(global) {
  const SAVE_KEY = "manrpg_save_v2";
  const SAVE_VERSION = 2;

  function getDefaultSaveShape() {
    return {
      version: SAVE_VERSION,
      gameState: "TITLE",
      progression: {
        profile: { name: "", gender: "", worldDestructionCause: "", destroyer: "", finalMoment: "", goal: "" },
        level: 1,
        floor: 1,
        coins: 0,
        statPoints: 0,
        growth: { baseStats: { strength: 1, agility: 1, vitality: 1, intelligence: 1, wisdom: 1, luck: 1 }, officialDerivedStats: null },
        hp: 10,
        mp: 15,
        mantra: "",
        originalMana: { name: "", type: "", description: "" },
        inventory: {
          externalManualCount: 0,
          internalManualCount: 0,
          swordEnergyCount: 0,
          spellBooks: [],
          grimoires: [],
          magicList: [],
          martialManualTicket: 0,
          skillResetTicketCount: 0,
        },
        manualUseCounts: { external: 0, internal: 0 },
        swordStage: 0,
        multiCastingCount: 1,
        skills: { slots: {}, selectedSlotId: null, cooldowns: {} },
        equippedMagicId: null,
        innerWorld: { active: false, step: "none", rewardChosen: false, statsDone: false, rewardGranted: false },
        floorState: { enemyHp: null, playerHp: null, playerMp: null, phase: null },
      },
    };
  }

  function normalizeSaveData(raw) {
    if (!raw || typeof raw !== "object") return { ok: false, reason: "empty", data: getDefaultSaveShape() };
    if (raw.version !== SAVE_VERSION) return { ok: false, reason: "version_mismatch", data: getDefaultSaveShape() };
    const base = getDefaultSaveShape();
    const p = { ...base.progression, ...(raw.progression || {}) };
    p.profile = { ...base.progression.profile, ...(raw.progression?.profile || {}) };
    p.originalMana = { ...base.progression.originalMana, ...(raw.progression?.originalMana || {}) };
    p.growth = { ...base.progression.growth, ...(raw.progression?.growth || {}) };
    p.growth.baseStats = { ...base.progression.growth.baseStats, ...(raw.progression?.growth?.baseStats || {}) };
    p.inventory = { ...base.progression.inventory, ...(raw.progression?.inventory || {}) };
    p.manualUseCounts = { ...base.progression.manualUseCounts, ...(raw.progression?.manualUseCounts || {}) };
    p.skills = { ...base.progression.skills, ...(raw.progression?.skills || {}) };
    p.innerWorld = { ...base.progression.innerWorld, ...(raw.progression?.innerWorld || {}) };
    p.floorState = { ...base.progression.floorState, ...(raw.progression?.floorState || {}) };

    return { ok: true, reason: "ok", data: { ...base, ...raw, progression: p } };
  }

  function saveCharacter(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadCharacter() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return normalizeSaveData(parsed);
    } catch (e) {
      return null;
    }
  }

  function hasSavedCharacter() {
    const loaded = loadCharacter();
    return !!(loaded && loaded.ok);
  }

  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  global.SAVE_VERSION = SAVE_VERSION;
  global.saveCharacter = saveCharacter;
  global.loadCharacter = loadCharacter;
  global.hasSavedCharacter = hasSavedCharacter;
  global.clearSave = clearSave;
  global.normalizeSaveData = normalizeSaveData;
  global.getDefaultSaveShape = getDefaultSaveShape;
})(window);
