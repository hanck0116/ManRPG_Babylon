(function initSpellBooks(global) {
  function rollSpellBookGrade() {
    const r = Math.random() * 100;
    if (r < 50) return "기초";
    if (r < 80) return "중급";
    if (r < 90) return "고급";
    if (r < 99) return "멀티케스팅의 서";
    return "마도서";
  }

  function rollCircleByGrade(grade) {
    if (grade === "기초") return Math.random() < 0.5 ? 1 : 2;
    if (grade === "중급") return Math.random() < 0.5 ? 3 : 4;
    if (grade === "고급") return Math.random() < 0.5 ? 5 : 6;
    if (grade === "마도서") {
      while (true) {
        const r = 7 + Math.floor(Math.random() * 4); // 7~10
        if (r === 10 && global.magicData.getSpellsByCircle(10).length === 0) continue;
        return r;
      }
    }
    return 0;
  }

  function rollDiceByGrade(grade) {
    const max = grade === "기초" ? 50 : grade === "중급" ? 70 : 100;
    return Math.floor(Math.random() * max) + 1;
  }

  function attemptLearnSpellBook(player, inventory) {
    const idx = inventory.spellBooks.findIndex((b) => !b.used);
    if (idx < 0) return { ok: false, reason: "no_book" };

    const book = inventory.spellBooks[idx];
    book.used = true;

    if (book.grade === "멀티케스팅의 서") {
      player.multiCastingCount += 1;
      return { ok: true, multi: true };
    }

    const circle = rollCircleByGrade(book.grade);
    const candidates = global.magicData.getSpellsByCircle(circle);
    if (!candidates.length) return { ok: false, reason: "no_spell_in_circle", circle };

    const roll = rollDiceByGrade(book.grade);
    const wisdom = player.growth.state.baseStats.wisdom;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    if (roll < wisdom) {
      if (!inventory.magicList.find((m) => m.id === picked.id)) {
        inventory.magicList.push({ ...picked });
      }
      return { ok: true, roll, spellName: picked.name, circle };
    }

    return { ok: false, roll, circle };
  }

  global.rollSpellBookGrade = rollSpellBookGrade;
  global.attemptLearnSpellBook = attemptLearnSpellBook;
})(window);
