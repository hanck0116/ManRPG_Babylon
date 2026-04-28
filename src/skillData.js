(function initSkillData(global) {
  const SKILL_SLOTS = [
    { id: "skill1", label: "1st", unlockLevel: 10, tierMultiplier: 1.5, mpCost: 50 },
    { id: "skill2", label: "2nd", unlockLevel: 20, tierMultiplier: 2.0, mpCost: 100 },
    { id: "skill3", label: "3rd", unlockLevel: 30, tierMultiplier: 2.5, mpCost: 150 },
    { id: "skill4", label: "4th", unlockLevel: 40, tierMultiplier: 3.0, mpCost: 220 },
    { id: "skill5", label: "5th", unlockLevel: 50, tierMultiplier: 4.0, mpCost: 300 },
    { id: "skill6", label: "6th", unlockLevel: 60, tierMultiplier: 5.0, mpCost: 400 },
    { id: "mandala", label: "만다라", unlockLevel: 70, tierMultiplier: 7.0, mpCost: 600, isMandala: true },
    { id: "skill8", label: "8th", unlockLevel: 80, tierMultiplier: 9.0, mpCost: 800 },
    { id: "skill9", label: "9th", unlockLevel: 90, tierMultiplier: 12.0, mpCost: 1000 },
  ];

  const SKILL_TYPES = ["melee", "projectile", "area", "buff", "defense", "movement"];
  const SKILL_ATTRIBUTES = ["neutral", "fire", "ice", "wind", "earth", "light", "dark"];

  function getSkillSlotMeta(slotId) {
    return SKILL_SLOTS.find((s) => s.id === slotId) || null;
  }

  function getSkillTierMultiplier(slotId) {
    const meta = getSkillSlotMeta(slotId);
    return meta ? meta.tierMultiplier : 1;
  }

  function getSkillMpCost(slotId) {
    const meta = getSkillSlotMeta(slotId);
    return meta ? meta.mpCost : 0;
  }

  global.SKILL_SLOTS = SKILL_SLOTS;
  global.SKILL_TYPES = SKILL_TYPES;
  global.SKILL_ATTRIBUTES = SKILL_ATTRIBUTES;
  global.getSkillSlotMeta = getSkillSlotMeta;
  global.getSkillTierMultiplier = getSkillTierMultiplier;
  global.getSkillMpCost = getSkillMpCost;
})(window);
