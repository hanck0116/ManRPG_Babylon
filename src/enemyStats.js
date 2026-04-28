(function initEnemyStats(global) {
  const ROLE_RATIO = {
    melee: { strength: 35, vitality: 25, agility: 20, wisdom: 10, intelligence: 5, appearance: 5 },
    agile: { agility: 35, strength: 20, vitality: 20, wisdom: 10, intelligence: 10, appearance: 5 },
    tank: { vitality: 40, strength: 20, agility: 15, wisdom: 10, intelligence: 10, appearance: 5 },
    mage: { wisdom: 30, intelligence: 30, agility: 15, vitality: 15, strength: 5, appearance: 5 },
    mixed: { strength: 17, agility: 17, vitality: 17, wisdom: 17, intelligence: 17, appearance: 15 },
  };

  function generateEnemyStats(player, enemyRole = "mixed") {
    const ratio = ROLE_RATIO[enemyRole] || ROLE_RATIO.mixed;
    const playerTotal = Object.values(player.primaryStats).reduce((a, b) => a + b, 0);
    const targetTotal = Math.floor(playerTotal * 1.15);

    const stats = {};
    Object.keys(ratio).forEach((k) => {
      stats[k] = Math.max(1, Math.floor((targetTotal * ratio[k]) / 100));
    });

    return {
      level: player.level,
      primaryStats: stats,
      maxHp: stats.vitality * 10,
      maxMp: player.level * 5 + stats.intelligence * 10,
      mpRegen: player.level + stats.wisdom * 2,
    };
  }

  global.generateEnemyStats = generateEnemyStats;
})(window);
