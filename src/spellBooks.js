(function initSpellBooks(global) {
  const SPELL_TABLE = {
    기초: ["파이어 스파크", "아쿠아 샷", "윈드 컷"],
    중급: ["파이어 볼", "아이스 스피어", "썬더 랜스"],
    고급: ["메테오 샤드", "글레이셜 스톰"],
    마도서: ["아스트랄 버스트"],
  };

  function attemptLearnSpellBook(player, inventory, extra = false) {
    const target = inventory.spellBooks.find((b) => !b.learned && b.grade !== "멀티케스팅의 서");
    if (!target) return { ok: false, reason: "no_book" };

    const diceMax = target.grade === "기초" ? 50 : target.grade === "중급" ? 70 : 100;
    const roll = Math.floor(Math.random() * diceMax) + 1;
    const wisdom = player.growth.state.baseStats.wisdom;

    if (roll < wisdom) {
      const pool = SPELL_TABLE[target.grade] || ["미확인 주문"];
      const spellName = pool[Math.floor(Math.random() * pool.length)];
      inventory.magicList.push({ name: spellName, grade: target.grade });
      target.learned = true;
      return { ok: true, roll, spellName };
    }
    return { ok: false, roll };
  }

  global.attemptLearnSpellBook = attemptLearnSpellBook;
})(window);
