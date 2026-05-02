function renderRewards(message = "") {
  const p = game.player;
  const body = `${message ? `<p class="success">${esc(message)}</p>` : ""}<p>보상 뽑기권 ${p.rewardDrawTicketCount}</p>
    <div class="toolbar"><button id="drawRewardBtn" ${p.rewardDrawTicketCount <= 0 ? "disabled" : ""}>보상 뽑기</button></div>
    <div class="inventory-list">${(game.currentRewards || []).map((r, i) => `<button data-reward="${i}">${esc(r.label)}</button>`).join("")}</div>`;
  showModal("보상 장치", body, () => {
    document.getElementById("drawRewardBtn").onclick = () => {
      if (p.rewardDrawTicketCount <= 0) return;
      p.rewardDrawTicketCount -= 1;
      game.currentRewards = Data.createRewardChoices();
      saveNow();
      renderRewards("둘 중 하나를 선택하세요.");
    };
    document.querySelectorAll("[data-reward]").forEach((btn) => {
      btn.onclick = () => {
        const reward = game.currentRewards[Number(btn.dataset.reward)];
        Data.applyReward(p, reward);
        game.currentRewards = [];
        saveNow();
        renderRewards(`${reward.label} 획득`);
      };
    });
  });
}

function useManual(kind) {
  const inv = game.player.inventory;
  if (inv[kind] <= 0) return false;
  inv[kind] -= 1;
  if (kind === "externalManual") game.player.externalManualUseCount += 1;
  if (kind === "internalManual") game.player.internalManualUseCount += 1;
  if (kind === "swordManual") game.player.swordStage = Math.min(6, game.player.swordStage + 1);
  Data.clampVitals(game.player);
  saveNow();
  return true;
}

function renderStorage(message = "") {
  const p = game.player;
  const inv = p.inventory;
  const books = inv.spellBooks.map((b, i) => `<button data-book="${i}">${Data.gradeLabel(b.grade)} 마법서</button>`).join("");
  const body = `${message ? `<p class="success">${esc(message)}</p>` : ""}
    <div class="inventory-list">
      <button data-manual="externalManual">외공서 ${inv.externalManual}</button>
      <button data-manual="internalManual">내공서 ${inv.internalManual}</button>
      <button data-manual="swordManual">검기서 ${inv.swordManual}</button>
      <button id="manualTicketBtn">무공서 뽑기권 ${inv.martialManualTicket}</button>
      <button id="multiBookBtn">멀티캐스팅 서 ${inv.multiCastingBooks}</button>
      <button id="grimoireBtn">마도서 ${inv.grimoires}</button>
      ${books || "<p class='muted'>보관된 일반 마법서 없음</p>"}
    </div>
    <h3>습득 마법</h3><div class="inventory-list">${p.magicList.map((id) => `<button data-equip-magic="${id}" ${p.equippedMagicId === id ? "disabled" : ""}>${Data.MAGIC_BY_ID[id].name}</button>`).join("")}</div>`;
  showModal("저장고", body, () => {
    document.querySelectorAll("[data-manual]").forEach((btn) => {
      btn.onclick = () => renderStorage(useManual(btn.dataset.manual) ? "무공서 사용" : "수량 부족");
    });
    document.getElementById("manualTicketBtn").onclick = () => {
      if (inv.martialManualTicket <= 0) return;
      inv.martialManualTicket -= 1;
      const pick = Data.pickRandom(["externalManual", "internalManual", "swordManual"]);
      inv[pick] += 1;
      saveNow();
      renderStorage("무공서 뽑기 완료");
    };
    document.getElementById("multiBookBtn").onclick = () => {
      if (inv.multiCastingBooks <= 0) return;
      inv.multiCastingBooks -= 1;
      p.multiCastingCount += 1;
      Data.clampVitals(p);
      saveNow();
      renderStorage("멀티캐스팅 +1");
    };
    document.getElementById("grimoireBtn").onclick = () => {
      if (inv.grimoires <= 0) return;
      inv.grimoires -= 1;
      const result = Data.rollSpellBookLearn(p, "grimoire");
      learnSpell(result.spell);
      saveNow();
      renderStorage(`마도서 사용: ${result.spell.name}`);
    };
    document.querySelectorAll("[data-book]").forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.book);
        const book = inv.spellBooks[idx];
        const result = Data.rollSpellBookLearn(p, book.grade);
        if (result.success) {
          learnSpell(result.spell);
          inv.spellBooks.splice(idx, 1);
          renderStorage(`${result.spell.name} 습득 성공`);
        } else {
          renderStorage(`습득 실패 d${result.die}: ${result.roll}`);
        }
        saveNow();
      };
    });
    document.querySelectorAll("[data-equip-magic]").forEach((btn) => {
      btn.onclick = () => {
        p.equippedMagicId = btn.dataset.equipMagic;
        saveNow();
        renderStorage("마법 장착");
      };
    });
  });
}

function learnSpell(spell) {
  if (spell && !game.player.magicList.includes(spell.id)) game.player.magicList.push(spell.id);
}

function renderMantraStatue(message = "") {
  const p = game.player;
  const cap = Data.getStatCap(p.level);
  const missing = Data.requiredUncreatedSkills(p);
  const statCards = Data.STAT_KEYS.map((key) => `<div class="choice-card"><strong>${Data.STAT_LABELS[key]}</strong><span>${p.primaryStats[key]} / ${cap}</span><button data-stat="${key}" ${p.statPoints <= 0 || p.primaryStats[key] >= cap ? "disabled" : ""}>+</button></div>`).join("");
  const skillCards = Data.SKILL_SLOTS.map((slot) => {
    const skill = p.skills[slot.id];
    const unlocked = p.level >= slot.level;
    return `<div class="choice-card"><strong>${slot.label}</strong><span>${skill ? esc(skill.name) : unlocked ? "생성 가능" : `Lv${slot.level} 필요`}</span>
      <button data-create-skill="${slot.id}" ${!unlocked || skill ? "disabled" : ""}>생성</button>
      ${skill && slot.id !== "mandala" ? `<button data-equip-skill="${slot.id}" ${p.equippedSkillId === slot.id ? "disabled" : ""}>장착</button>` : ""}</div>`;
  }).join("");
  const body = `${message ? `<p class="success">${esc(message)}</p>` : ""}<p>스탯 포인트 ${p.statPoints}</p><div class="card-list">${statCards}</div><h3>스킬</h3><div class="card-list">${skillCards}</div>${missing.length ? `<p class="error">다음 층 진입 전 생성 필요: ${missing.map((s) => s.label).join(", ")}</p>` : ""}`;
  showModal(`만트라 석상: ${p.mantra}`, body, () => {
    document.querySelectorAll("[data-stat]").forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.stat;
        if (p.statPoints <= 0 || p.primaryStats[key] >= cap) return;
        p.primaryStats[key] += 1;
        p.statPoints -= 1;
        Data.clampVitals(p);
        saveNow();
        renderMantraStatue("스탯 투자 완료");
      };
    });
    document.querySelectorAll("[data-create-skill]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.createSkill;
        p.skills[id] = Data.createSkillForSlot(p, id);
        if (!p.equippedSkillId && id !== "mandala") p.equippedSkillId = id;
        saveNow();
        renderMantraStatue(`${p.skills[id].name} 생성`);
      };
    });
    document.querySelectorAll("[data-equip-skill]").forEach((btn) => {
      btn.onclick = () => {
        p.equippedSkillId = btn.dataset.equipSkill;
        saveNow();
        renderMantraStatue("스킬 장착");
      };
    });
  });
}

function buy(cost, apply, message) {
  if (game.player.coins < cost) return false;
  game.player.coins -= cost;
  apply();
  saveNow();
  renderShop(message);
  return true;
}

function renderShop(message = "") {
  const inv = game.player.inventory;
  const price = Data.SHOP_PRICES;
  const body = `${message ? `<p class="success">${esc(message)}</p>` : ""}<p>코인 ${game.player.coins}</p>
    <h3>구매</h3><div class="inventory-list">
      <button data-buy="external">외공서 ${price.externalManualBuy}</button><button data-buy="internal">내공서 ${price.internalManualBuy}</button>
      <button data-buy="sword">검기서 ${price.swordManualBuy}</button><button data-buy="ticket">무공서 뽑기권 ${price.martialManualTicket}</button>
      <button data-buy="basic">기초 마법서 선택권 ${price.spellBasicChoice}</button><button data-buy="intermediate">중급 마법서 선택권 ${price.spellIntermediateChoice}</button>
      <button data-buy="advanced">고급 마법서 선택권 ${price.spellAdvancedChoice}</button></div>
    <h3>판매</h3><div class="inventory-list">
      <button data-sell="external" ${inv.externalManual <= 0 ? "disabled" : ""}>외공서 ${price.externalManualSell} (${inv.externalManual})</button>
      <button data-sell="internal" ${inv.internalManual <= 0 ? "disabled" : ""}>내공서 ${price.internalManualSell} (${inv.internalManual})</button>
      <button data-sell="sword" ${inv.swordManual <= 0 ? "disabled" : ""}>검기서 ${price.swordManualSell} (${inv.swordManual})</button></div>`;
  showModal("상점", body, () => {
    document.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.onclick = () => {
        const type = btn.dataset.buy;
        if (type === "external") buy(price.externalManualBuy, () => (inv.externalManual += 1), "외공서 구매");
        if (type === "internal") buy(price.internalManualBuy, () => (inv.internalManual += 1), "내공서 구매");
        if (type === "sword") buy(price.swordManualBuy, () => (inv.swordManual += 1), "검기서 구매");
        if (type === "ticket") buy(price.martialManualTicket, () => (inv.martialManualTicket += 1), "무공서 뽑기권 구매");
        if (type === "basic") buy(price.spellBasicChoice, () => inv.spellBooks.push({ id: `shop_basic_${Date.now()}`, grade: "basic" }), "기초 마법서 구매");
        if (type === "intermediate") buy(price.spellIntermediateChoice, () => inv.spellBooks.push({ id: `shop_mid_${Date.now()}`, grade: "intermediate" }), "중급 마법서 구매");
        if (type === "advanced") buy(price.spellAdvancedChoice, () => inv.spellBooks.push({ id: `shop_adv_${Date.now()}`, grade: "advanced" }), "고급 마법서 구매");
      };
    });
    document.querySelectorAll("[data-sell]").forEach((btn) => {
      btn.onclick = () => {
        const map = { external: ["externalManual", price.externalManualSell], internal: ["internalManual", price.internalManualSell], sword: ["swordManual", price.swordManualSell] };
        const [key, coins] = map[btn.dataset.sell];
        if (inv[key] <= 0) return;
        inv[key] -= 1;
        game.player.coins += coins;
        saveNow();
        renderShop("판매 완료");
      };
    });
  });
}

function spawnTrainingDummy() {
  clearTrainingDummy();
  const mesh = BABYLON.MeshBuilder.CreateBox("trainingDummy", { size: 1.25 }, scene);
  mesh.position = new BABYLON.Vector3(0, 0.8, -1.2);
  mesh.material = material("dummyMat", new BABYLON.Color3(0.95, 0.42, 0.36));
  trainingDummy = { mesh, hp: 300, maxHp: 300 };
  game.innerWorld.trainingDummyActive = true;
}

function clearTrainingDummy() {
  if (trainingDummy?.mesh) trainingDummy.mesh.dispose();
  trainingDummy = null;
  game.innerWorld.trainingDummyActive = false;
}

function renderTraining() {
  const body = `<p>훈련 더미 HP ${trainingDummy ? Math.ceil(trainingDummy.hp) : "-"}</p><div class="toolbar">
    <button id="spawnDummyBtn">${trainingDummy ? "더미 재생성" : "훈련 더미 생성"}</button>
    <button id="clearDummyBtn" ${trainingDummy ? "" : "disabled"}>더미 제거</button></div>`;
  showModal("연습실", body, () => {
    document.getElementById("spawnDummyBtn").onclick = () => {
      spawnTrainingDummy();
      renderTraining();
    };
    document.getElementById("clearDummyBtn").onclick = () => {
      clearTrainingDummy();
      saveNow();
      renderTraining();
    };
  });
}

function renderNextGate() {
  const missing = Data.requiredUncreatedSkills(game.player);
  const warnings = [];
  if (game.player.statPoints > 0) warnings.push(`미사용 스탯 ${game.player.statPoints}`);
  if (game.player.rewardDrawTicketCount > 0) warnings.push(`미사용 보상 뽑기권 ${game.player.rewardDrawTicketCount}`);
  const body = `${missing.length ? `<p class="error">미생성 스킬: ${missing.map((s) => s.label).join(", ")}</p>` : ""}${warnings.length ? `<p class="muted">${warnings.join(" / ")}</p>` : ""}
    <button id="goNextFloorBtn" ${missing.length ? "disabled" : ""}>다음 층 진입</button>`;
  showModal("다음 층 게이트", body, () => {
    document.getElementById("goNextFloorBtn").onclick = () => {
      game.player.floor += 1;
      game.floorState = { enemyHp: null, rewardGranted: false, enemyRole: "melee" };
      clearTrainingDummy();
      startFloorCombat(false);
    };
  });
}

function renderGameOver() {
  setControls(false);
  setOverlay(true);
  overlay.innerHTML = `<div class="panel compact"><h1>패배</h1><p>탑의 장벽이 등반자를 주저앉혔습니다.</p><div class="toolbar"><button id="gameOverTitleBtn">타이틀</button><button id="gameOverNewBtn">새 게임</button></div></div>`;
  document.getElementById("gameOverTitleBtn").onclick = renderTitle;
  document.getElementById("gameOverNewBtn").onclick = () => {
    Save.clear();
    game = Data.createDefaultGameState();
    renderCreation();
  };
}
