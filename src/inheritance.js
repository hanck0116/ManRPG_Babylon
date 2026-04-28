(function initInheritance(global) {
  function addInheritanceSkill(inventory, rewardPayload, slotIndex = null) {
    const skill = rewardPayload?.weakened;
    if (!skill) return false;

    if (inventory.inheritanceSlots.length < 3) {
      inventory.inheritanceSlots.push(skill);
      return true;
    }

    if (slotIndex !== null && slotIndex >= 0 && slotIndex < 3) {
      inventory.inheritanceSlots[slotIndex] = skill;
      return true;
    }

    return false;
  }

  global.addInheritanceSkill = addInheritanceSkill;
})(window);
