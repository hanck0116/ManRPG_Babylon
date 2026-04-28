(function initRewards(global) {
  const REWARD_TYPES = [
    { type: "inheritance", weight: 10 },
    { type: "spellBook", weight: 30 },
    { type: "mpPotion", weight: 30 },
    { type: "hpPotion", weight: 30 },
  ];

  function rollByWeight() {
    const roll = Math.random() * 100;
    let acc = 0;
    for (const item of REWARD_TYPES) {
      acc += item.weight;
      if (roll < acc) return item.type;
    }
    return "hpPotion";
  }

  function generateReward(enemyData = {}) {
    const type = rollByWeight();

    if (type === "inheritance") {
      const skills = enemyData.patternSkills || enemyData.skills || [
        { id: "enemy_slash", name: "적 베기", power: 10, cooldown: 1.0, range: 1.5 },
        { id: "enemy_dash", name: "적 돌진", power: 12, cooldown: 1.6, range: 2.2 },
      ];
      const picked = skills[Math.floor(Math.random() * skills.length)];
      return {
        type,
        name: "전승",
        desc: `적 스킬 전승 후보: ${picked.name}`,
        payload: {
          sourceSkill: picked,
          weakened: {
            id: `${picked.id}_inherited`,
            name: `${picked.name}(전승)` ,
            power: Math.max(1, Math.floor((picked.power || 10) * 0.6)),
            cooldown: (picked.cooldown || 1.0) * 1.35,
            range: (picked.range || 1.5) * 0.85,
          },
        },
      };
    }

    if (type === "spellBook") {
      return {
        type,
        name: "마법서",
        desc: "마법서 1권 획득",
        payload: { grade: rollSpellBookGrade() },
      };
    }

    if (type === "mpPotion") {
      return { type, name: "마나 포션", desc: "MP 포션 +1", payload: { amount: 1 } };
    }

    return { type: "hpPotion", name: "체력 포션", desc: "HP 포션 +1", payload: { amount: 1 } };
  }

  function rollSpellBookGrade() {
    const r = Math.random();
    if (r < 0.55) return "기초";
    if (r < 0.85) return "중급";
    if (r < 0.97) return "고급";
    if (r < 0.99) return "멀티케스팅의 서";
    return "마도서";
  }

  function generateRewardChoices(enemyData) {
    return [generateReward(enemyData), generateReward(enemyData)];
  }

  function rerollRewards(enemyData) {
    return generateRewardChoices(enemyData);
  }

  global.generateReward = generateReward;
  global.generateRewardChoices = generateRewardChoices;
  global.rerollRewards = rerollRewards;
})(window);
