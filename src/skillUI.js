(function initSkillUI(global) {
  function getPendingSkillLabel(player) {
    const slotId = global.getPendingSkillSlot(player);
    if (!slotId) return null;
    const meta = global.getSkillSlotMeta(slotId);
    return meta ? `${meta.label} (${slotId})` : slotId;
  }

  global.getPendingSkillLabel = getPendingSkillLabel;
})(window);
