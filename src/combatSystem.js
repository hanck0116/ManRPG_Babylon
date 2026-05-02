function createBattleSystem() {
  const enemy = { mesh: null, hp: null, maxHp: 0, stats: null, role: "melee", ai: 0, attackCd: 0 };
  const runtime = { attack: 0, dodge: 0, magic: 0, skill: 0, inv: 0, feedback: "", lock: false, casting: 0 };
  const projectiles = [];
  const phase = { value: "idle" };
  const attackMat = material("enemyMat", new BABYLON.Color3(0.9, 0.28, 0.22));
  function spawnEnemy(role) {
    if (enemy.mesh) enemy.mesh.dispose();
    enemy.stats = Data.createEnemyForPlayer(game.player, role);
    enemy.role = role;
    enemy.maxHp = enemy.stats.maxHp;
    enemy.hp = enemy.maxHp;
    enemy.ai = 0;
    enemy.attackCd = 1;
    const mesh = BABYLON.MeshBuilder.CreateCapsule("enemy", { height: 1.9, radius: 0.42 }, scene);
    mesh.position = new BABYLON.Vector3(0, 1, -4.3);
    mesh.material = attackMat;
    enemy.mesh = mesh;
    ManRPGModelLoader.attachModel(scene, mesh, "enemyDefault", mesh);
    phase.value = "playing";
  }
  function despawnEnemy() {
    if (enemy.mesh) enemy.mesh.dispose();
    Object.assign(enemy, { mesh: null, hp: null, maxHp: 0, stats: null, role: "melee" });
    phase.value = "idle";
  }
  function cooldown(dt) {
    ["attack", "dodge", "magic", "skill", "inv", "casting"].forEach((k) => (runtime[k] = Math.max(0, runtime[k] - dt)));
    if (enemy.attackCd > 0) enemy.attackCd -= dt;
    if (game.player.preparingSpell) game.player.preparingSpell.remaining -= dt;
    if (game.player.preparingSpell && game.player.preparingSpell.remaining <= 0) {
      game.player.preparingSpell = null;
      runtime.feedback = "마법 준비가 흐트러졌다";
    }
  }
  function faceAndDistance(target) {
    if (!target) return 999;
    const v = target.position.subtract(playerRoot.position);
    v.y = 0;
    if (v.lengthSquared() > 0.01) playerRoot.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, Math.atan2(v.x, v.z), 0);
    return v.length();
  }
  function damageEnemy(amount) {
    if (phase.value !== "playing" || !enemy.mesh) return;
    enemy.hp = Math.max(0, enemy.hp - amount);
    if (enemy.hp <= 0) phase.value = "clear";
  }
  function damageDummy(amount) {
    if (!trainingDummy) return;
    trainingDummy.hp = Math.max(0, trainingDummy.hp - amount);
    if (trainingDummy.hp <= 0) clearTrainingDummy();
  }
  function basicAttack() {
    if (runtime.attack > 0) return;
    runtime.attack = game.player.combatTuning.attackCooldown;
    if (game.gameState === Data.GAME_STATES.INNER_WORLD && nearestInnerObject && faceAndDistance(nearestInnerObject.mesh) < 2.25 && !game.innerWorld.openedUI) {
      openInnerObject(nearestInnerObject.type);
      return;
    }
    const target = game.gameState === Data.GAME_STATES.FLOOR_COMBAT ? enemy.mesh : trainingDummy?.mesh;
    const dist = faceAndDistance(target);
    if (dist <= 2.2) {
      const amount = game.player.officialDerivedStats.basicAttackDamage;
      if (game.gameState === Data.GAME_STATES.FLOOR_COMBAT) damageEnemy(amount);
      else damageDummy(amount);
      runtime.feedback = `평타 ${amount}`;
    }
  }
  function castMagic(spell) {
    if (runtime.magic > 0 || game.player.currentMp < spell.mpCost) return;
    runtime.magic = game.player.combatTuning.magicCooldown;
    game.player.currentMp -= spell.mpCost;
    const amount = spell.damage + Math.floor(Data.getEffectiveStats(game.player).intelligence * spell.circle * 0.25);
    if (spell.type === "heal") {
      game.player.currentHp = Math.min(game.player.officialDerivedStats.maxHp, game.player.currentHp + Math.max(40, spell.circle * 24));
    } else if (spell.type === "shield" || spell.type === "buff") {
      game.player.temporaryBuffs.push({ type: spell.type, duration: spell.duration || 6, power: spell.circle });
    } else if (game.gameState === Data.GAME_STATES.FLOOR_COMBAT) {
      faceAndDistance(enemy.mesh);
      damageEnemy(amount);
    } else {
      damageDummy(amount);
    }
    runtime.feedback = `${spell.name} ${amount || ""}`;
  }
  function magicAction() {
    const p = game.player;
    if (p.preparingSpell) {
      const spell = Data.MAGIC_BY_ID[p.preparingSpell.magicId];
      p.preparingSpell = null;
      if (!p.preparedSpells.includes(spell.id) && p.preparedSpells.length < p.officialDerivedStats.multiCastingCount) p.preparedSpells.push(spell.id);
      castMagic(spell);
      return;
    }
    const spell = Data.MAGIC_BY_ID[p.equippedMagicId] || Data.MAGIC_BY_ID.fire;
    if (!spell || p.currentMp < spell.mpCost) return;
    p.preparingSpell = { magicId: spell.id, remaining: spell.prepareTime };
    runtime.feedback = `${spell.name} 준비`;
  }
  function useSkill() {
    if (runtime.skill > 0) return;
    const skill = game.player.skills[game.player.equippedSkillId];
    if (!skill || game.player.currentMp < skill.mpCost) return;
    runtime.skill = game.player.combatTuning.skillCooldown;
    game.player.currentMp -= skill.mpCost;
    const amount = Math.floor(game.player.officialDerivedStats.basicAttackDamage * skill.powerMultiplier);
    if (game.gameState === Data.GAME_STATES.FLOOR_COMBAT) damageEnemy(amount);
    else damageDummy(amount);
    runtime.feedback = `${skill.name} ${amount}`;
  }
  function playerStep(dt, move, actions) {
    if (actions.attack) basicAttack();
    if (actions.magic) magicAction();
    if (actions.skill) useSkill();
    if (actions.lock) runtime.lock = !runtime.lock;
    if (actions.dodge && runtime.dodge <= 0 && move.lengthSquared() > 0) {
      playerRoot.position.addInPlace(new BABYLON.Vector3(move.x, 0, move.y).normalize().scale(game.player.combatTuning.dodgeDistance));
      runtime.dodge = 1.1;
      runtime.inv = game.player.combatTuning.dodgeInvincibleTime;
    }
    if (actions.guard) runtime.inv = Math.max(runtime.inv, 0.04);
  }
  function enemyStep(dt) {
    if (phase.value !== "playing" || !enemy.mesh) return;
    const toPlayer = playerRoot.position.subtract(enemy.mesh.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist > 1.8) enemy.mesh.position.addInPlace(toPlayer.normalize().scale((enemy.role === "agile" ? 3.2 : 2.2) * dt));
    if (dist <= 2 && enemy.attackCd <= 0) {
      const reduced = runtime.inv > 0 ? 0 : enemy.stats.basicAttackDamage;
      game.player.currentHp = Math.max(0, game.player.currentHp - reduced);
      runtime.feedback = reduced ? `피해 ${reduced}` : "회피/가드";
      enemy.attackCd = enemy.role === "agile" ? 0.8 : 1.25;
      if (game.player.currentHp <= 0) {
        game.gameState = Data.GAME_STATES.GAME_OVER;
        phase.value = "dead";
      }
    }
  }
  function update(dt, move, actions) {
    runtime.feedback = "";
    cooldown(dt);
    game.player.currentMp = Math.min(game.player.officialDerivedStats.maxMp, game.player.currentMp + game.player.officialDerivedStats.mpRegen * dt);
    playerStep(dt, move, actions);
    enemyStep(dt);
    Data.clampVitals(game.player);
  }
  function clamp(radius) {
    const p = playerRoot.position;
    const len = Math.hypot(p.x, p.z);
    if (len > radius) {
      p.x = (p.x / len) * radius;
      p.z = (p.z / len) * radius;
    }
  }
  return {
    spawnEnemy,
    despawnEnemy,
    update,
    clamp,
    damageDummy,
    getPhase: () => phase.value,
    getEnemy: () => enemy,
    getRuntime: () => runtime,
    isLockOn: () => runtime.lock,
    cooldowns: () => runtime,
  };
}

function enemyRoleForFloor(floor) {
  const roles = ["melee", "agile", "defense", "magic", "mixed"];
  return floor % 10 === 0 ? "mixed" : roles[floor % roles.length];
}

function startFloorCombat(first) {
  closeModal();
  setOverlay(false);
  setControls(true);
  input.setEnabled(true);
  game.gameState = Data.GAME_STATES.FLOOR_COMBAT;
  game.currentMode = "floor_combat";
  game.floorState = { enemyHp: null, rewardGranted: false, enemyRole: enemyRoleForFloor(game.player.floor) };
  playerRoot.position = new BABYLON.Vector3(0, 1, 3.7);
  currentMap = mapManager.showFloorCombatMap({ mapId: game.player.floor % 10 === 0 ? "bossVoidRoom" : "defaultCylinderRoom" }, { floor: game.player.floor, level: game.player.level });
  battle.spawnEnemy(game.floorState.enemyRole);
  saveNow();
  if (first) showToast("1층 전투 시작");
}

function completeFloorOnce() {
  if (game.floorState.rewardGranted) return;
  game.floorState.rewardGranted = true;
  const p = game.player;
  p.level += 5;
  p.statPoints += 15;
  p.coins += 1;
  p.rewardDrawTicketCount += 1;
  p.preparedSpells = [];
  p.preparingSpell = null;
  p.temporaryBuffs = [];
  Data.clampVitals(p);
  p.currentHp = p.officialDerivedStats.maxHp;
  p.currentMp = p.officialDerivedStats.maxMp;
  enterInnerWorld("층 클리어: 레벨 +5, 스탯 +15, 코인 +1, 보상 뽑기권 +1");
}

function enterInnerWorld(message = "") {
  battle.despawnEnemy();
  setOverlay(false);
  setControls(true);
  input.setEnabled(true);
  game.gameState = Data.GAME_STATES.INNER_WORLD;
  game.currentMode = "inner_world";
  game.innerWorld.openedUI = null;
  playerRoot.position = new BABYLON.Vector3(game.playerPosition.x || 0, 1, game.playerPosition.z || 0);
  currentMap = mapManager.showInnerWorldMap({ level: game.player.level, mantra: game.player.mantra });
  if (message) showToast(message, 3);
  saveNow();
}

function findNearestInnerObject() {
  if (game.gameState !== Data.GAME_STATES.INNER_WORLD || game.innerWorld.openedUI) return null;
  let best = null;
  for (const item of mapManager.getInteractables()) {
    const dist = BABYLON.Vector3.Distance(playerRoot.position, item.mesh.position);
    if (dist < 2.4 && (!best || dist < best.dist)) best = { ...item, dist };
  }
  return best;
}

function updateInnerActions(actions) {
  nearestInnerObject = findNearestInnerObject();
  if (actions.attack && nearestInnerObject) openInnerObject(nearestInnerObject.type);
}

function openInnerObject(type) {
  if (type === "rewardDevice") return renderRewards();
  if (type === "storage") return renderStorage();
  if (type === "mantraStatue") return renderMantraStatue();
  if (type === "shop") return renderShop();
  if (type === "trainingRoom") return renderTraining();
  if (type === "nextGate") return renderNextGate();
}

