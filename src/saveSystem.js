(function initSaveSystem(global) {
  const SAVE_KEY = "ManRPG_Babylon_Save";
  const SAVE_VERSION = 2;

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function migrate(raw) {
    const fallback = global.ManRPGData.createDefaultGameState();
    if (!raw || typeof raw !== "object") return fallback;
    const merged = { ...fallback, ...raw };
    merged.player = { ...fallback.player, ...(raw.player || {}) };
    merged.player.profile = raw.player?.profile || fallback.player.profile;
    merged.player.originalMana = { ...fallback.player.originalMana, ...(raw.player?.originalMana || {}) };
    merged.player.primaryStats = { ...fallback.player.primaryStats, ...(raw.player?.primaryStats || raw.player?.stats || {}) };
    merged.player.bonusStats = { ...fallback.player.bonusStats, ...(raw.player?.bonusStats || {}) };
    merged.player.combatTuning = { ...fallback.player.combatTuning, ...(raw.player?.combatTuning || {}) };
    merged.player.inventory = { ...fallback.player.inventory, ...(raw.player?.inventory || {}) };
    merged.player.inventory.spellBooks = Array.isArray(raw.player?.inventory?.spellBooks) ? raw.player.inventory.spellBooks : [];
    merged.player.preparedSpells = Array.isArray(raw.player?.preparedSpells) ? raw.player.preparedSpells.slice(0, merged.player.multiCastingCount || 1) : [];
    merged.player.skills = raw.player?.skills || {};
    merged.currentRewards = Array.isArray(raw.currentRewards) ? raw.currentRewards : [];
    merged.rewardSelectionState = { ...fallback.rewardSelectionState, ...(raw.rewardSelectionState || {}) };
    merged.floorState = { ...fallback.floorState, ...(raw.floorState || {}) };
    merged.innerWorld = { ...fallback.innerWorld, ...(raw.innerWorld || {}) };
    merged.playerPosition = { ...fallback.playerPosition, ...(raw.playerPosition || {}) };
    global.ManRPGData.clampVitals(merged.player);
    return merged;
  }

  function save(gameState) {
    const payload = clone(gameState);
    payload.saveVersion = SAVE_VERSION;
    payload.savedAt = new Date().toISOString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return migrate(JSON.parse(raw));
    } catch (error) {
      console.warn("Save load failed", error);
      return null;
    }
  }

  function clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  global.ManRPGSave = { SAVE_VERSION, save, load, clear, hasSave, migrate };
})(window);
