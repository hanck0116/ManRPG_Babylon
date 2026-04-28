(function initSpellBooks(global) {
  const SPELL_TABLE = {
    기초: ["파이어 스파크", "아쿠아 샷", "윈드 컷"],
    중급: ["파이어 볼", "아이스 스피어", "썬더 랜스"],
    고급: ["메테오 샤드", "글레이셜 스톰"],
  };

  const HIGH_TIER_MAGIC_POOL = [
    { name: "7서클: 대폭염", circle: 7 },
    { name: "8서클: 시공 붕괴", circle: 8 },
    { name: "9서클: 성운 소환", circle: 9 },
    { name: "10서클: 무한소멸", circle: 10 },
  ];

  function attemptLearnSpellBook(player, inventory) {
    const idx = inventory.spellBooks.findIndex((b) => !b.used);
    if (idx < 0) return { ok: false, reason: "no_book" };

    const target = inventory.spellBooks[idx];
    target.used = true;

    if (target.grade === "멀티케스팅의 서") {
      return { ok: true, special: true };
    }

    if (target.grade === "마도서") {
      const high = HIGH_TIER_MAGIC_POOL[Math.floor(Math.random() * HIGH_TIER_MAGIC_POOL.length)];
      inventory.magicList.push({ name: high.name, grade: target.grade, circle: high.circle });
      return { ok: true, highTier: true, spellName: high.name };
    }

    const diceMax = target.grade === "기초" ? 50 : target.grade === "중급" ? 70 : 100;
    const roll = Math.floor(Math.random() * diceMax) + 1;
    const wisdom = player.growth.state.baseStats.wisdom;

    if (roll < wisdom) {
      const pool = SPELL_TABLE[target.grade] || ["미확인 주문"];
      const spellName = pool[Math.floor(Math.random() * pool.length)];
      inventory.magicList.push({ name: spellName, grade: target.grade });
      return { ok: true, roll, spellName };
    }

    return { ok: false, roll };
  }

  global.attemptLearnSpellBook = attemptLearnSpellBook;
})(window);
