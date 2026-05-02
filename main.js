const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const Data = window.ManRPGData;
const Save = window.ManRPGSave;
const overlay = document.getElementById("appOverlay");
const modalOverlay = document.getElementById("modalOverlay");
const toast = document.getElementById("toast");
const hint = document.getElementById("interactionHint");
const hud = {
  root: document.getElementById("hud"),
  floorInfo: document.getElementById("floorInfo"),
  modeInfo: document.getElementById("modeInfo"),
  progressInfo: document.getElementById("progressInfo"),
  playerHp: document.getElementById("playerHp"),
  playerMp: document.getElementById("playerMp"),
  enemyHp: document.getElementById("enemyHp"),
  mantraInfo: document.getElementById("mantraInfo"),
  spellInfo: document.getElementById("spellInfo"),
  preparedInfo: document.getElementById("preparedInfo"),
  battleMessage: document.getElementById("battleMessage"),
  actionFeedback: document.getElementById("actionFeedback"),
};

let game = Data.createDefaultGameState();
let scene, camera, playerRoot, input, mapManager, battle, playerMat;
let currentMap = null;
let trainingDummy = null;
let nearestInnerObject = null;
let toastTimer = 0;
const draft = {
  name: "",
  gender: "",
  mantra: Data.MANTRA_OPTIONS[0],
  originalManaName: "",
  originalManaType: "attribute",
  originalManaDescription: "",
  worldDestructionCause: "",
  destroyer: "",
  destroyerShape: "",
  destroyerCombatStyle: "",
  finalMoment: "",
  goal: "",
  strongestEmotion: "",
  allocatedStats: Data.createEmptyStats(9),
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function saveNow() {
  if (playerRoot) game.playerPosition = { x: playerRoot.position.x, y: playerRoot.position.y, z: playerRoot.position.z };
  Save.save(game);
}

function showToast(text, seconds = 2.2) {
  toast.textContent = text;
  toast.classList.remove("hidden");
  toastTimer = seconds;
}

function setOverlay(visible) {
  overlay.classList.toggle("hidden", !visible);
}

function setControls(visible) {
  document.getElementById("mobileJoystick").classList.toggle("hidden", !visible);
  document.getElementById("actionButtons").classList.toggle("hidden", !visible);
  hud.root.classList.toggle("hidden", !visible);
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalOverlay.innerHTML = "";
  game.innerWorld.openedUI = null;
  nearestInnerObject = null;
  saveNow();
}

function showModal(title, body, afterRender) {
  game.innerWorld.openedUI = title;
  modalOverlay.classList.remove("hidden");
  modalOverlay.innerHTML = `<div class="panel compact"><h2>${esc(title)}</h2>${body}<div class="toolbar"><button id="modalCloseBtn">닫기</button></div></div>`;
  document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
  if (afterRender) afterRender();
}

function renderTitle() {
  game.gameState = Data.GAME_STATES.TITLE;
  game.currentMode = "title";
  setControls(false);
  setOverlay(true);
  overlay.innerHTML = `<div class="panel compact">
    <h1>ManRPG Babylon</h1>
    <p>상실한 세계의 탑에서 너의 만트라와 마법을 다시 세운다.</p>
    <div class="toolbar">
      <button id="newGameBtn">새 게임</button>
      <button id="loadGameBtn" ${Save.hasSave() ? "" : "disabled"}>이어하기</button>
    </div>
  </div>`;
  document.getElementById("newGameBtn").onclick = () => {
    Save.clear();
    game = Data.createDefaultGameState();
    renderCreation();
  };
  document.getElementById("loadGameBtn").onclick = () => {
    const loaded = Save.load();
    if (!loaded) return;
    game = loaded;
    restoreLoadedGame();
  };
}

function syncDraft() {
  document.querySelectorAll("[data-draft]").forEach((el) => (draft[el.dataset.draft] = el.value));
}

function statTotal() {
  return Data.STAT_KEYS.reduce((sum, key) => sum + draft.allocatedStats[key], 0);
}

function validateCreation() {
  syncDraft();
  const errors = [];
  if (!draft.name.trim()) errors.push("이름을 입력해야 합니다.");
  if (!draft.gender.trim()) errors.push("성별을 입력해야 합니다.");
  if (statTotal() !== 54) errors.push("스탯 분배 합계는 정확히 54여야 합니다.");
  if (!draft.originalManaName.trim() || !draft.originalManaDescription.trim()) errors.push("오리지널 마나 이름과 설명이 필요합니다.");
  ["worldDestructionCause", "destroyer", "destroyerShape", "destroyerCombatStyle", "finalMoment", "goal", "strongestEmotion"].forEach((key) => {
    if (!draft[key].trim()) errors.push(`${key} 항목이 비어 있습니다.`);
  });
  return [...new Set(errors)];
}

function renderCreation(errors = []) {
  game.gameState = Data.GAME_STATES.CHARACTER_CREATION;
  setControls(false);
  setOverlay(true);
  const total = statTotal();
  const statHtml = Data.STAT_KEYS.map((key) => `
    <div class="stat-control">
      <strong>${Data.STAT_LABELS[key]}</strong>
      <div class="muted">최종 ${draft.allocatedStats[key] + 1}</div>
      <div class="stat-actions">
        <button data-minus="${key}">-</button><span>${draft.allocatedStats[key]}</span><button data-plus="${key}" ${total >= 54 ? "disabled" : ""}>+</button>
      </div>
    </div>`).join("");
  overlay.innerHTML = `<div class="panel">
    <h1>캐릭터 생성</h1>
    ${errors.length ? `<p class="error">${errors.map(esc).join("<br>")}</p>` : ""}
    <div class="grid">
      <label class="form-row">이름<input data-draft="name" value="${esc(draft.name)}"></label>
      <label class="form-row">성별<input data-draft="gender" value="${esc(draft.gender)}"></label>
    </div>
    <h3>능력치 분배 <span class="${total === 54 ? "success" : "muted"}">${total} / 54</span></h3>
    <div class="stat-grid">${statHtml}</div>
    <div class="grid">
      <label class="form-row">만트라<select data-draft="mantra">${Data.MANTRA_OPTIONS.map((m) => `<option value="${esc(m)}" ${m === draft.mantra ? "selected" : ""}>${esc(m)}</option>`).join("")}</select></label>
      <label class="form-row">오리지널 마나 타입<select data-draft="originalManaType">
        <option value="attribute" ${draft.originalManaType === "attribute" ? "selected" : ""}>속성</option>
        <option value="special" ${draft.originalManaType === "special" ? "selected" : ""}>특수</option>
      </select></label>
      <label class="form-row">오리지널 마나 이름<input data-draft="originalManaName" value="${esc(draft.originalManaName)}"></label>
      <label class="form-row">가장 강한 감정<input data-draft="strongestEmotion" value="${esc(draft.strongestEmotion)}"></label>
    </div>
    <label class="form-row">오리지널 마나 설명<textarea data-draft="originalManaDescription">${esc(draft.originalManaDescription)}</textarea></label>
    <div class="grid">
      <label class="form-row">세계 멸망 원인<textarea data-draft="worldDestructionCause">${esc(draft.worldDestructionCause)}</textarea></label>
      <label class="form-row">멸망시킨 존재<textarea data-draft="destroyer">${esc(draft.destroyer)}</textarea></label>
      <label class="form-row">존재의 형상<textarea data-draft="destroyerShape">${esc(draft.destroyerShape)}</textarea></label>
      <label class="form-row">존재의 전투 방식<textarea data-draft="destroyerCombatStyle">${esc(draft.destroyerCombatStyle)}</textarea></label>
      <label class="form-row">마지막 순간<textarea data-draft="finalMoment">${esc(draft.finalMoment)}</textarea></label>
      <label class="form-row">목표<textarea data-draft="goal">${esc(draft.goal)}</textarea></label>
    </div>
    <div class="toolbar"><button id="confirmCreationBtn">시트 확인</button><button id="creationBackBtn">타이틀</button></div>
  </div>`;
  document.querySelectorAll("[data-minus]").forEach((btn) => {
    btn.onclick = () => {
      syncDraft();
      draft.allocatedStats[btn.dataset.minus] = Math.max(0, draft.allocatedStats[btn.dataset.minus] - 1);
      renderCreation();
    };
  });
  document.querySelectorAll("[data-plus]").forEach((btn) => {
    btn.onclick = () => {
      syncDraft();
      if (statTotal() < 54) draft.allocatedStats[btn.dataset.plus] += 1;
      renderCreation();
    };
  });
  document.getElementById("confirmCreationBtn").onclick = () => {
    const nextErrors = validateCreation();
    if (nextErrors.length) return renderCreation(nextErrors);
    game.player = Data.createPlayerFromCreation(draft);
    game.gameState = Data.GAME_STATES.CHARACTER_CONFIRM;
    saveNow();
    renderConfirm();
  };
  document.getElementById("creationBackBtn").onclick = renderTitle;
}

function renderConfirm() {
  setControls(false);
  setOverlay(true);
  const p = game.player;
  const d = p.officialDerivedStats;
  overlay.innerHTML = `<div class="panel compact">
    <h1>캐릭터 시트</h1>
    <div class="grid">
      <p><strong>이름</strong><br>${esc(p.profile.name)}</p><p><strong>성별</strong><br>${esc(p.profile.gender)}</p>
      <p><strong>만트라</strong><br>${esc(p.mantra)}</p><p><strong>오리지널 마나</strong><br>${esc(p.originalMana.name)}</p>
    </div>
    <div class="grid three">${Data.STAT_KEYS.map((k) => `<p>${Data.STAT_LABELS[k]} ${p.primaryStats[k]}</p>`).join("")}</div>
    <div class="grid"><p>HP ${d.maxHp}</p><p>MP ${d.maxMp}</p><p>MP 회복 ${d.mpRegen.toFixed(1)}</p><p>평타 피해 ${d.basicAttackDamage}</p></div>
    <p class="muted">${esc(p.profile.goal)}</p>
    <div class="toolbar"><button id="startFloorBtn">1층 시작</button><button id="editCreationBtn">수정</button></div>
  </div>`;
  document.getElementById("startFloorBtn").onclick = () => startFloorCombat(true);
  document.getElementById("editCreationBtn").onclick = renderCreation;
}

function createInput() {
  const keys = { w: false, a: false, s: false, d: false };
  const actions = { attack: false, dodge: false, guard: false, magic: false, skill: false, lock: false };
  const keyMap = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };
  let enabled = false;
  window.addEventListener("keydown", (e) => {
    if (keyMap[e.code]) keys[keyMap[e.code]] = true;
    if (e.code === "Space") actions.attack = true;
    if (e.code === "ShiftLeft") actions.dodge = true;
    if (e.code === "KeyQ") actions.guard = true;
    if (e.code === "KeyE") actions.magic = true;
    if (e.code === "KeyR") actions.skill = true;
    if (e.code === "Tab") {
      e.preventDefault();
      actions.lock = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    if (keyMap[e.code]) keys[keyMap[e.code]] = false;
    if (e.code === "KeyQ") actions.guard = false;
  });
  function bind(id, name, held = false) {
    const btn = document.getElementById(id);
    btn.onpointerdown = (e) => {
      if (!enabled) return;
      e.preventDefault();
      btn.classList.add("is-active");
      actions[name] = true;
    };
    const up = () => {
      btn.classList.remove("is-active");
      if (held) actions[name] = false;
    };
    btn.onpointerup = up;
    btn.onpointercancel = up;
  }
  bind("attackBtn", "attack");
  bind("dodgeBtn", "dodge");
  bind("guardBtn", "guard", true);
  bind("magicBtn", "magic");
  bind("skillBtn", "skill");
  bind("lockBtn", "lock");
  return {
    setEnabled: (v) => (enabled = v),
    move: () => new BABYLON.Vector2((keys.d ? 1 : 0) - (keys.a ? 1 : 0), (keys.w ? 1 : 0) - (keys.s ? 1 : 0)),
    actions: () => {
      const out = { ...actions };
      actions.attack = actions.dodge = actions.magic = actions.skill = actions.lock = false;
      return out;
    },
    buttonState: (cooldowns) => {
      document.getElementById("attackBtn").disabled = cooldowns.attack > 0;
      document.getElementById("dodgeBtn").disabled = cooldowns.dodge > 0;
      document.getElementById("magicBtn").disabled = cooldowns.magic > 0;
      document.getElementById("skillBtn").disabled = cooldowns.skill > 0;
    },
  };
}

function material(name, color) {
  const mat = new BABYLON.StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.12);
  return mat;
}

