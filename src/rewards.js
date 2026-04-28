(function initRewards(global) {
  function generateMartialManual() {
    const r = Math.random();
    if (r < 0.4) return { manualType: "external", name: "외공서", desc: "사용 시 최대 체력 x1.2" };
    if (r < 0.8) return { manualType: "internal", name: "내공서", desc: "사용 시 최대 MP/회복 x1.1" };
    return { manualType: "sword", name: "검기", desc: "사용 시 검기 단계 +1" };
  }

  function generateReward() {
    const roll = Math.random();

    if (roll < 0.05) {
      return { type: "skillResetTicket", name: "스킬 초기화권", desc: "스킬 초기화권 +1", payload: { amount: 1 } };
    }

    if (roll < 0.15) {
      const m = generateMartialManual();
      return { type: "martialManual", name: m.name, desc: m.desc, payload: m };
    }

    if (roll < 0.4) {
      const grade = global.rollSpellBookGrade();
      return { type: "spellBook", name: "마법서", desc: `${grade} 마법서 획득`, payload: { grade } };
    }

    if (roll < 0.8) {
      return { type: "coin", name: "추가 코인", desc: "코인 +1", payload: { amount: 1 } };
    }

    return { type: "coin", name: "추가 코인", desc: "코인 +2", payload: { amount: 2 } };
  }

  function generateRewardChoices() {
    return [generateReward(), generateReward()];
  }

  function rerollRewards() {
    return generateRewardChoices();
  }

  global.generateMartialManual = generateMartialManual;
  global.generateReward = generateReward;
  global.generateRewardChoices = generateRewardChoices;
  global.rerollRewards = rerollRewards;
})(window);
