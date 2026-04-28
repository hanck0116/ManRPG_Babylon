(function initSaveSystem(global) {
  const SAVE_KEY = "manrpg_character_v1";

  function saveCharacter(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadCharacter() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function hasSavedCharacter() {
    return !!loadCharacter();
  }

  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  global.saveCharacter = saveCharacter;
  global.loadCharacter = loadCharacter;
  global.hasSavedCharacter = hasSavedCharacter;
  global.clearSave = clearSave;
})(window);
