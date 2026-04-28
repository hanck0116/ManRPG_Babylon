const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);

const BASE_STATS = {
  strength: 10,
  agility: 10,
  vitality: 10,
  intelligence: 10,
  wisdom: 10,
  luck: 10,
};

const COMBAT_STATE = {
  COMBAT_READY: "COMBAT_READY",
  COMBAT_ACTIVE: "COMBAT_ACTIVE",
  PLAYER_DEAD: "PLAYER_DEAD",
  ENEMY_DEAD: "ENEMY_DEAD",
  INNER_WORLD: "INNER_WORLD",
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function createProgressionState() {
  const growth = createGrowthModel();
  return {
    floor: 1,
    level: 1,
    statPoints: 0,
    coins: 0,
    swordStage: 0,
    mantra: "화염",
    spellSlots: {
      equipped: "firebolt",
      known: [
        {
          id: "firebolt",
          name: "화염구",
          mantra: "화염",
          mpCost: 14,
          damageScale: 1.25,
          speed: 16,
          radius: 0.18,
          range: 14,
        },
      ],
    },
    growth,
    inventory: createInventoryState(),
    currentRewards: [],
    currentEnemyData: { skills: [] },
    innerWorld: createInnerWorldState(),
  };
}

function createInputController(scene) {
  const keys = { w: false, a: false, s: false, d: false };
  const action = { attackPressed: false, dodgePressed: false, guardHeld: false, magicPressed: false, lockToggle: false };
  let enabled = true;

  const joystickRoot = document.getElementById("mobileJoystick");
  const joystickBase = document.getElementById("joystickBase");
  const joystickKnob = document.getElementById("joystickKnob");
  const attackBtn = document.getElementById("attackBtn");
  const dodgeBtn = document.getElementById("dodgeBtn");
  const guardBtn = document.getElementById("guardBtn");
  const magicBtn = document.getElementById("magicBtn");
  const lockBtn = document.getElementById("lockBtn");

  const movement = { keyboard: new BABYLON.Vector2(), joystick: new BABYLON.Vector2() };
  const keyMap = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };
  const maxDistance = 33;
  let activeJoystickPointerId = null;

  function setEnabled(v) {
    enabled = v;
    if (!enabled) {
      movement.joystick.set(0, 0);
      movement.keyboard.set(0, 0);
      action.attackPressed = false;
      action.dodgePressed = false;
      action.guardHeld = false;
      action.magicPressed = false;
      action.lockToggle = false;
      joystickKnob.style.left = "50%";
      joystickKnob.style.top = "50%";
    }
  }

  function bindPressButton(button, onDown, onUp) {
    let pointerId = null;
    button.addEventListener("pointerdown", (e) => {
      if (!enabled) return;
      e.preventDefault();
      pointerId = e.pointerId;
      button.setPointerCapture(pointerId);
      button.classList.add("is-active");
      onDown();
    });

    function stop(e) {
      if (pointerId !== e.pointerId) return;
      if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
      pointerId = null;
      button.classList.remove("is-active");
      onUp();
    }

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
  }

  bindPressButton(
    attackBtn,
    () => (action.attackPressed = true),
    () => {}
  );
  bindPressButton(
    dodgeBtn,
    () => (action.dodgePressed = true),
    () => {}
  );
  bindPressButton(
    guardBtn,
    () => (action.guardHeld = true),
    () => (action.guardHeld = false)
  );
  bindPressButton(
    magicBtn,
    () => (action.magicPressed = true),
    () => {}
  );
  bindPressButton(
    lockBtn,
    () => (action.lockToggle = true),
    () => {}
  );

  function updateJoystick(clientX, clientY) {
    const rect = joystickBase.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxDistance) {
      const ratio = maxDistance / dist;
      dx *= ratio;
      dy *= ratio;
    }
    movement.joystick.set(dx / maxDistance, -dy / maxDistance);
    joystickKnob.style.left = `calc(50% + ${dx}px)`;
    joystickKnob.style.top = `calc(50% + ${dy}px)`;
  }

  joystickRoot.addEventListener("pointerdown", (e) => {
    if (!enabled) return;
    e.preventDefault();
    activeJoystickPointerId = e.pointerId;
    joystickRoot.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  });
  joystickRoot.addEventListener("pointermove", (e) => {
    if (!enabled || e.pointerId !== activeJoystickPointerId) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  });
  function stopJoystick(e) {
    if (e.pointerId !== activeJoystickPointerId) return;
    if (joystickRoot.hasPointerCapture(e.pointerId)) joystickRoot.releasePointerCapture(e.pointerId);
    activeJoystickPointerId = null;
    movement.joystick.set(0, 0);
    joystickKnob.style.left = "50%";
    joystickKnob.style.top = "50%";
  }
  joystickRoot.addEventListener("pointerup", stopJoystick);
  joystickRoot.addEventListener("pointercancel", stopJoystick);

  scene.onKeyboardObservable.add((kb) => {
    const isDown = kb.type === BABYLON.KeyboardEventTypes.KEYDOWN;
    const isUp = kb.type === BABYLON.KeyboardEventTypes.KEYUP;
    const code = kb.event.code;
    if (!enabled) return;

    if (keyMap[code]) {
      if (isDown) keys[keyMap[code]] = true;
      if (isUp) keys[keyMap[code]] = false;
    }

    if (code === "Space" && isDown) action.attackPressed = true;
    if ((code === "ShiftLeft" || code === "ShiftRight") && isDown) action.dodgePressed = true;
    if (code === "KeyQ" && isDown) action.magicPressed = true;
    if (code === "KeyR" && isDown) action.lockToggle = true;
    if (code === "KeyF") {
      if (isDown) action.guardHeld = true;
      if (isUp) action.guardHeld = false;
    }
  });

  return {
    setEnabled,
    consumeActions() {
      const out = { ...action };
      action.attackPressed = false;
      action.dodgePressed = false;
      action.magicPressed = false;
      action.lockToggle = false;
      return out;
    },
    getMoveInput() {
      let x = 0;
      let z = 0;
      if (keys.w) z += 1;
      if (keys.s) z -= 1;
      if (keys.a) x -= 1;
      if (keys.d) x += 1;
      movement.keyboard.set(x, z);
      const move = movement.keyboard.add(movement.joystick);
      if (move.lengthSquared() > 1) move.normalize();
      return move;
    },
    setActionButtonsState(state) {
      attackBtn.disabled = !state.attack;
      dodgeBtn.disabled = !state.dodge;
      magicBtn.disabled = !state.magic;
      lockBtn.classList.toggle("is-active", !!state.locked);
    },
  };
}

function getFacing(mesh) {
  if (!mesh.rotationQuaternion) mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
  const m = BABYLON.Matrix.Identity();
  mesh.rotationQuaternion.toRotationMatrix(m);
  return BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, m).normalize();
}

function createBattleSystem(scene, player, progression) {
  const playerState = {
    hp: 100, maxHp: 100, mp: 100, maxMp: 100, mpRegen: 1,
    moveSpeed: 4.5, attackDamage: 20, critChance: 0.05,
    dodgeSpeed: 11, dodgeDuration: 0.22, dodgeDistance: 2.6,
    dodgeTimer: 0, dodging: false, invincible: false, guardHeld: false,
    attackTimer: 0, attackCooldown: 0, dodgeCooldown: 0, magicCooldown: 0,
    attackHitDone: false, feedback: "", feedbackTimer: 0, hitFlashTimer: 0,
  };
  let enemy = null; let enemyFront = null; let enemyMat = null;
  let enemyDescriptor = { type: "default", mapId: "defaultCylinderRoom" };
  const enemyState = { hp: 100, maxHp: 100, moveSpeed: 2.6, attackDamage: 12, attackRange: 1.6, chaseRange: 10, attackCooldown: 0, mode: "approach", modeTimer: 0, attackHitDone: false, dashTimer: 0, dashDir: new BABYLON.Vector3(0, 0, 1), hitFlashTimer: 0 };
  const projectileState = [];
  let arenaRadius = 8.2;
  let combatState = COMBAT_STATE.COMBAT_READY;
  let lockOnActive = false;
  const battle = { phase: "playing" };

  function clampInsideArena(position) {
    const radius = arenaRadius - 0.35;
    const len = Math.hypot(position.x, position.z);
    if (len > radius && len > 0.0001) { const s = radius / len; position.x *= s; position.z *= s; }
  }
  function spawnFx(pos, color) {
    const r = BABYLON.MeshBuilder.CreateTorus(`fx_${Date.now()}_${Math.random()}`, { diameter: 0.7, thickness: 0.05 }, scene);
    r.position.copyFrom(pos); r.rotation.x = Math.PI / 2;
    const m = new BABYLON.StandardMaterial(`fxm_${Date.now()}_${Math.random()}`, scene); m.emissiveColor = color; m.alpha = 0.8; r.material = m;
    setTimeout(() => r.dispose(), 120);
  }
  function applyKnockback(target, sourcePos, dist) {
    if (!target) return; const d = target.position.subtract(sourcePos); d.y = 0; if (d.lengthSquared() < 0.0001) return; d.normalize();
    target.position.addInPlace(d.scale(dist)); clampInsideArena(target.position);
  }
  function recomputePlayerFromStats() {
    const d = progression.growth.recalculate(progression.swordStage);
    playerState.maxHp = d.maxHp;
    playerState.maxMp = d.maxMp;
    playerState.mpRegen = d.mpRegen;
    playerState.moveSpeed = d.moveSpeed;
    playerState.attackDamage = d.attackDamage;
    playerState.critChance = d.critChance;
    playerState.dodgeDistance = d.dodgeDistance;
    playerState.dodgeSpeed = playerState.dodgeDistance / playerState.dodgeDuration;
    playerState.hp = Math.min(playerState.hp, playerState.maxHp);
    playerState.mp = Math.min(playerState.mp, playerState.maxMp);
  }
  function spawnEnemyForFloor(floor) {
    if (enemy) { enemy.dispose(); enemyFront.dispose(); }
    const maps = ["defaultCylinderRoom", "beastArena", "mageChamber", "bossVoidRoom"];
    enemyDescriptor = { type: floor % 4 === 0 ? "boss" : floor % 2 === 0 ? "beast" : "soldier", mapId: maps[(floor - 1) % maps.length] };
    enemyDescriptor.patternSkills = [
      { id: "slash", name: "베기", power: 10 + floor, cooldown: 1.1, range: 1.6 },
      { id: "rush", name: "돌진", power: 12 + floor, cooldown: 1.5, range: 2.3 },
      { id: "guardBreak", name: "가드 브레이크", power: 9 + floor, cooldown: 1.8, range: 1.7 },
      { id: "shock", name: "충격파", power: 11 + floor, cooldown: 2.1, range: 2.0 },
    ];
    enemy = BABYLON.MeshBuilder.CreateCapsule("enemy", { height: 2, radius: 0.4 }, scene);
    enemy.position = new BABYLON.Vector3(0, 1, 5); enemy.rotationQuaternion = BABYLON.Quaternion.Identity();
    enemyMat = new BABYLON.StandardMaterial(`enemyMat${floor}`, scene); enemyMat.diffuseColor = new BABYLON.Color3(1, 0.65, 0.65); enemy.material = enemyMat;
    enemyFront = BABYLON.MeshBuilder.CreateCylinder("enemyFront", { diameterTop: 0, diameterBottom: 0.24, height: 0.35, tessellation: 4 }, scene);
    enemyFront.parent = enemy; enemyFront.position = new BABYLON.Vector3(0, 1.0, 0.55); enemyFront.rotation.x = Math.PI / 2;
    const fm = new BABYLON.StandardMaterial(`enemyFrontMat${floor}`, scene); fm.emissiveColor = new BABYLON.Color3(1, 0.25, 0.25); enemyFront.material = fm;
    const f = Math.max(1, floor);
    enemyState.maxHp = 90 + (f - 1) * 16;
    enemyState.hp = enemyState.maxHp;
    enemyState.moveSpeed = 2.2 + f * 0.1;
    enemyState.attackDamage = 9 + f * 1.6;
    enemyState.attackRange = 1.6 + Math.min(0.4, f * 0.02);
    enemyState.attackCooldown = Math.max(0.7, 1.35 - f * 0.03);
    enemyState.mode = "approach"; enemyState.modeTimer = 0; enemyState.attackHitDone = false;
    battle.phase = "playing"; combatState = COMBAT_STATE.COMBAT_ACTIVE; lockOnActive = false;
  }
  function recoverFull() { playerState.hp = playerState.maxHp; playerState.mp = playerState.maxMp; }
  function dealDamageToEnemy(amount) {
    if (enemyState.hp <= 0) return;
    enemyState.hp = Math.max(0, enemyState.hp - amount); enemyState.hitFlashTimer = 0.12; applyKnockback(enemy, player.position, 0.55);
    if (enemyState.hp <= 0) { battle.phase = "clear"; combatState = COMBAT_STATE.ENEMY_DEAD; lockOnActive = false; }
  }
  function dealDamageToPlayer(amount) {
    if (playerState.invincible) return;
    let final = amount;
    if (playerState.guardHeld && enemy) {
      const f = getFacing(player); const e = enemy.position.subtract(player.position); e.y = 0;
      const guardDot = 0.12 + (progression.growth.state.derivedStats.guardReduction || 0) * 0.2;
      if (e.lengthSquared() > 0) { e.normalize(); if (BABYLON.Vector3.Dot(f, e) >= guardDot) { final = 0; playerState.feedback = "가드 성공"; playerState.feedbackTimer = 0.2; spawnFx(player.position.add(new BABYLON.Vector3(0, 1, 0)), new BABYLON.Color3(0.3, 0.6, 1)); } }
    }
    playerState.hp = Math.max(0, playerState.hp - final);
    if (final > 0 && enemy) { playerState.hitFlashTimer = 0.1; applyKnockback(player, enemy.position, playerState.guardHeld ? 0.2 : 0.5); }
    if (playerState.hp <= 0) { battle.phase = "defeat"; combatState = COMBAT_STATE.PLAYER_DEAD; lockOnActive = false; }
  }
  function castMagic() {
    const spell = progression.spellSlots.known.find((s) => s.id === progression.spellSlots.equipped);
    if (!spell || !enemy) return;
    if (playerState.mp < spell.mpCost) { playerState.feedback = "MP 부족"; playerState.feedbackTimer = 0.2; return; }
    playerState.mp -= spell.mpCost; playerState.feedback = "마법"; playerState.feedbackTimer = 0.2;
    const forward = getFacing(player);
    const b = BABYLON.MeshBuilder.CreateSphere(`magic_${Date.now()}`, { diameter: spell.radius * 2 }, scene);
    b.position = player.position.add(forward.scale(0.9)).add(new BABYLON.Vector3(0, 0.6, 0));
    const m = new BABYLON.StandardMaterial(`magicMat_${Date.now()}`, scene); m.emissiveColor = new BABYLON.Color3(1, 0.45, 0.18); b.material = m;
    const magicDamage = progression.growth.state.derivedStats.magicDamage || playerState.attackDamage;
    projectileState.push({ mesh: b, dir: forward, speed: spell.speed, remain: spell.range, damage: magicDamage * spell.damageScale });
  }

  return {
    setupForFloor(floor) { recomputePlayerFromStats(); spawnEnemyForFloor(floor); player.position.set(0, 1, 0); player.rotationQuaternion = BABYLON.Quaternion.Identity(); },
    refreshDerivedStats() { recomputePlayerFromStats(); },
    recoverFull,
    setArenaRadius(radius) { arenaRadius = radius; clampInsideArena(player.position); if (enemy) clampInsideArena(enemy.position); },
    clampAllInsideArena() { clampInsideArena(player.position); if (enemy) clampInsideArena(enemy.position); },
    update(delta, moveDir, actions) {
      if (battle.phase !== "playing") return;
      playerState.attackCooldown = Math.max(0, playerState.attackCooldown - delta);
      playerState.dodgeCooldown = Math.max(0, playerState.dodgeCooldown - delta);
      playerState.magicCooldown = Math.max(0, playerState.magicCooldown - delta);
      playerState.mp = Math.min(playerState.maxMp, playerState.mp + playerState.mpRegen * delta);
      playerState.guardHeld = !!actions.guardHeld && !playerState.dodging;
      enemyState.attackCooldown = Math.max(0, enemyState.attackCooldown - delta);
      if (actions.attackPressed && playerState.attackCooldown <= 0 && !playerState.dodging) { playerState.attackTimer = 0.16; playerState.attackCooldown = 0.32; playerState.attackHitDone = false; spawnFx(player.position.add(new BABYLON.Vector3(0, 1, 0.7)), new BABYLON.Color3(1, 0.5, 0.2)); }
      if (actions.dodgePressed && !playerState.dodging && playerState.dodgeCooldown <= 0) { playerState.dodging = true; playerState.dodgeTimer = playerState.dodgeDuration; playerState.dodgeCooldown = 0.6; playerState.invincible = true; }
      if (actions.magicPressed && playerState.magicCooldown <= 0) { playerState.magicCooldown = 0.38; castMagic(); }
      if (playerState.attackTimer > 0) {
        playerState.attackTimer -= delta;
        if (!playerState.attackHitDone && enemy) {
          const toEnemy = enemy.position.subtract(player.position); toEnemy.y = 0;
          if (toEnemy.length() <= 1.85) { toEnemy.normalize(); if (BABYLON.Vector3.Dot(getFacing(player), toEnemy) > 0.2) { const crit = Math.random() < playerState.critChance ? 1.5 : 1; dealDamageToEnemy(playerState.attackDamage * crit); playerState.attackHitDone = true; } }
        }
      }
      if (playerState.dodging) {
        const d = moveDir.lengthSquared() > 0 ? moveDir : getFacing(player);
        player.position.addInPlace(d.scale(playerState.dodgeSpeed * delta)); clampInsideArena(player.position);
        playerState.dodgeTimer -= delta; if (playerState.dodgeTimer < 0.12) playerState.invincible = false; if (playerState.dodgeTimer <= 0) { playerState.dodging = false; playerState.invincible = false; }
      }
      if (enemy) {
        const toPlayer = player.position.subtract(enemy.position); toPlayer.y = 0; const dist = toPlayer.length();
        if (dist > 0.001) { const dir = toPlayer.normalize(); const yaw = Math.atan2(dir.x, dir.z); enemy.rotationQuaternion = BABYLON.Quaternion.Slerp(enemy.rotationQuaternion, BABYLON.Quaternion.FromEulerAngles(0, yaw, 0), Math.min(1, delta * 8)); }
        enemyState.modeTimer = Math.max(0, enemyState.modeTimer - delta);
        if (enemyState.mode === "approach") { if (dist > 2.1) enemy.position.addInPlace(toPlayer.normalize().scale(enemyState.moveSpeed * delta)); else { enemyState.mode = "hold"; enemyState.modeTimer = 0.4; } }
        else if (enemyState.mode === "hold") {
          if (dist < 1.4) enemy.position.addInPlace(toPlayer.normalize().scale(-enemyState.moveSpeed * 0.7 * delta));
          if (enemyState.modeTimer <= 0) {
            if (enemyState.attackCooldown <= 0 && Math.random() < 0.35) { enemyState.mode = "dash"; enemyState.dashTimer = 0.25; enemyState.dashDir.copyFrom(toPlayer.normalize()); enemyState.attackHitDone = false; enemyState.attackCooldown = Math.max(0.65, 1.25 - progression.floor * 0.04); }
            else if (enemyState.attackCooldown <= 0) { enemyState.mode = "basicAttack"; enemyState.modeTimer = 0.22; enemyState.attackHitDone = false; enemyState.attackCooldown = Math.max(0.72, 1.35 - progression.floor * 0.03); }
            else { enemyState.mode = "retreat"; enemyState.modeTimer = 0.25; }
          }
        } else if (enemyState.mode === "basicAttack") {
          if (!enemyState.attackHitDone && dist <= enemyState.attackRange + 0.25) { enemyState.attackHitDone = true; dealDamageToPlayer(enemyState.attackDamage); }
          if (enemyState.modeTimer <= 0) { enemyState.mode = "cooldown"; enemyState.modeTimer = 0.25; }
        } else if (enemyState.mode === "dash") {
          enemy.position.addInPlace(enemyState.dashDir.scale(enemyState.moveSpeed * 2.6 * delta)); enemyState.dashTimer -= delta;
          if (!enemyState.attackHitDone && dist <= enemyState.attackRange + 0.35) { enemyState.attackHitDone = true; dealDamageToPlayer(enemyState.attackDamage * 1.25); }
          if (enemyState.dashTimer <= 0) { enemyState.mode = "retreat"; enemyState.modeTimer = 0.2; }
        } else if (enemyState.mode === "retreat") {
          if (dist < 2.6) enemy.position.addInPlace(toPlayer.normalize().scale(-enemyState.moveSpeed * delta));
          if (enemyState.modeTimer <= 0) { enemyState.mode = "cooldown"; enemyState.modeTimer = 0.25; }
        } else if (enemyState.mode === "cooldown" && enemyState.modeTimer <= 0) enemyState.mode = dist > 2.4 ? "approach" : "hold";
        if (dist > 6.5) enemyState.mode = "approach";
        clampInsideArena(enemy.position);
      }
      for (let i = projectileState.length - 1; i >= 0; i--) {
        const p = projectileState[i]; const step = p.speed * delta; p.mesh.position.addInPlace(p.dir.scale(step)); p.remain -= step;
        if (enemy) { const d = BABYLON.Vector3.Distance(p.mesh.position, enemy.position.add(new BABYLON.Vector3(0, 0.7, 0))); if (d <= 0.8) { dealDamageToEnemy(p.damage); p.remain = 0; } }
        if (p.remain <= 0) { p.mesh.dispose(); projectileState.splice(i, 1); }
      }
      playerState.feedbackTimer = Math.max(0, playerState.feedbackTimer - delta); if (playerState.feedbackTimer <= 0) playerState.feedback = "";
      playerState.hitFlashTimer = Math.max(0, playerState.hitFlashTimer - delta); enemyState.hitFlashTimer = Math.max(0, enemyState.hitFlashTimer - delta);
    },
    getPlayerState() { return { ...playerState }; },
    getEnemyState() { return { ...enemyState, mesh: enemy }; },
    getEnemyDescriptor() { return { ...enemyDescriptor }; },
    despawnEnemy() { if (enemy) enemy.dispose(); if (enemyFront) enemyFront.dispose(); enemy = null; enemyFront = null; enemyMat = null; lockOnActive = false; combatState = COMBAT_STATE.INNER_WORLD; projectileState.forEach((p) => p.mesh.dispose()); projectileState.length = 0; },
    getPhase() { return battle.phase; },
    getCombatState() { return combatState; },
    toggleLockOn() { if (enemy && enemyState.hp > 0) lockOnActive = !lockOnActive; else lockOnActive = false; return lockOnActive; },
    isLockOnActive() { return lockOnActive; },
    getCooldownState() { return { attack: playerState.attackCooldown <= 0, dodge: playerState.dodgeCooldown <= 0 && !playerState.dodging, magic: playerState.magicCooldown <= 0 && playerState.mp >= 14 }; },
    setPlayerEmissive(playerMat) {
      if (playerState.dodging) playerMat.emissiveColor = new BABYLON.Color3(0.2, 0.9, 1);
      else if (playerState.guardHeld) playerMat.emissiveColor = new BABYLON.Color3(0.2, 0.45, 1);
      else if (playerState.attackTimer > 0) playerMat.emissiveColor = new BABYLON.Color3(1, 0.45, 0.2);
      else playerMat.emissiveColor = BABYLON.Color3.Black();
      playerMat.alpha = playerState.dodging ? 0.55 : 1;
      if (playerState.hitFlashTimer > 0) playerMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
      if (enemyMat) { enemyMat.emissiveColor = enemyState.mode === "basicAttack" || enemyState.mode === "dash" ? new BABYLON.Color3(1, 0.2, 0.2) : BABYLON.Color3.Black(); if (enemyState.hitFlashTimer > 0) enemyMat.emissiveColor = new BABYLON.Color3(1, 1, 1); }
    },
  };
}

function createScene() {
  const scene = new BABYLON.Scene(engine);
  const progression = createProgressionState();
  const mapManager = createMapManager(scene);
  let gameMode = MAP_STATE.FLOOR_COMBAT;

  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 12, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 18;

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.95;

  BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);

  const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.4 }, scene);
  player.position.y = 1;
  player.rotationQuaternion = BABYLON.Quaternion.Identity();
  const playerMat = new BABYLON.StandardMaterial("playerMat", scene);
  playerMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 1);
  player.material = playerMat;

  const playerFront = BABYLON.MeshBuilder.CreateCylinder("playerFront", { diameterTop: 0, diameterBottom: 0.24, height: 0.35, tessellation: 4 }, scene);
  playerFront.parent = player;
  playerFront.position = new BABYLON.Vector3(0, 1, 0.55);
  playerFront.rotation.x = Math.PI / 2;
  const playerFrontMat = new BABYLON.StandardMaterial("playerFrontMat", scene);
  playerFrontMat.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2);
  playerFront.material = playerFrontMat;

  const input = createInputController(scene);
  const battle = createBattleSystem(scene, player, progression);
  battle.setupForFloor(progression.floor);
  const initialMap = mapManager.showFloorCombatMap(battle.getEnemyDescriptor(), { floor: progression.floor, level: progression.level });
  battle.setArenaRadius(initialMap.bounds?.arenaRadius || 8.2);

  const hud = {
    floorInfo: document.getElementById("floorInfo"),
    progressInfo: document.getElementById("progressInfo"),
    playerHp: document.getElementById("playerHp"),
    playerMp: document.getElementById("playerMp"),
    enemyHp: document.getElementById("enemyHp"),
    mantraInfo: document.getElementById("mantraInfo"),
    spellInfo: document.getElementById("spellInfo"),
    manualInfo: document.getElementById("manualInfo"),
    swordStageInfo: document.getElementById("swordStageInfo"),
    battleMessage: document.getElementById("battleMessage"),
    actionFeedback: document.getElementById("actionFeedback"),
  };

  const ui = {
    inner: document.getElementById("innerWorld"),
    innerStepText: document.getElementById("innerStepText"),
    rewardPanel: document.getElementById("rewardPanel"),
    rewardChoices: document.getElementById("rewardChoices"),
    rerollBtn: document.getElementById("rerollBtn"),
    statPanel: document.getElementById("statPanel"),
    statList: document.getElementById("statList"),
    statDoneBtn: document.getElementById("statDoneBtn"),
    nextFloorBtn: document.getElementById("nextFloorBtn"),
    manualPanel: document.getElementById("manualPanel"),
    manualCounts: document.getElementById("manualCounts"),
    useExternalBtn: document.getElementById("useExternalBtn"),
    useInternalBtn: document.getElementById("useInternalBtn"),
    useSwordBtn: document.getElementById("useSwordBtn"),
    manualDoneBtn: document.getElementById("manualDoneBtn"),
    spellBookPanel: document.getElementById("spellBookPanel"),
    spellBookList: document.getElementById("spellBookList"),
    learnSpellBtn: document.getElementById("learnSpellBtn"),
    extraLearnBtn: document.getElementById("extraLearnBtn"),
    spellBookDoneBtn: document.getElementById("spellBookDoneBtn"),
    shopPanel: document.getElementById("shopPanel"),
    buyExternalBtn: document.getElementById("buyExternalBtn"),
    buyInternalBtn: document.getElementById("buyInternalBtn"),
    buySwordBtn: document.getElementById("buySwordBtn"),
    buyTicketBtn: document.getElementById("buyTicketBtn"),
    drawTicketBtn: document.getElementById("drawTicketBtn"),
    sellExternalBtn: document.getElementById("sellExternalBtn"),
    sellInternalBtn: document.getElementById("sellInternalBtn"),
    sellSwordBtn: document.getElementById("sellSwordBtn"),
    shopDoneBtn: document.getElementById("shopDoneBtn"),
  };

  function enterInnerWorld() {
    if (progression.innerWorld.rewardGranted) return;
    progression.innerWorld.rewardGranted = true;
    progression.innerWorld.active = true;
    progression.innerWorld.step = "recovery";
    progression.innerWorld.rewardChosen = false;
    progression.innerWorld.statsDone = false;
    battle.recoverFull();

    progression.level += 5;
    progression.statPoints += 15;
    progression.coins += 1;
    progression.currentRewards = generateRewardChoices(progression.currentEnemyData);
    battle.despawnEnemy();

    input.setEnabled(false);
    ui.inner.classList.remove("hidden");
    gameMode = MAP_STATE.INNER_WORLD;
    mapManager.showInnerWorldMap({ floor: progression.floor, level: progression.level });
    camera.radius = 16;
    camera.beta = Math.PI / 2.8;

    progression.innerWorld.step = "reward";
    renderInnerWorld();
  }

  function leaveInnerWorldToNextFloor() {
    progression.floor += 1;
    progression.innerWorld.active = false;
    progression.innerWorld.step = "none";
    progression.innerWorld.rewardGranted = false;
    ui.inner.classList.add("hidden");
    input.setEnabled(true);
    battle.setupForFloor(progression.floor);
    const floorMap = mapManager.showFloorCombatMap(battle.getEnemyDescriptor(), { floor: progression.floor, level: progression.level });
    battle.setArenaRadius(floorMap.bounds?.arenaRadius || 8.2);
    gameMode = MAP_STATE.FLOOR_COMBAT;
    camera.radius = 11;
    camera.beta = Math.PI / 3.2;
  }

  function renderStatPanel() {
    ui.statList.innerHTML = "";
    const labels = {
      strength: "힘",
      agility: "민첩",
      vitality: "체력",
      intelligence: "지능",
      wisdom: "지혜",
      luck: "외모(운)",
    };

    Object.keys(labels).forEach((key) => {
      const wrap = document.createElement("div");
      wrap.textContent = `${labels[key]}: ${progression.growth.state.baseStats[key]}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "+1";
      btn.disabled = progression.statPoints <= 0;
      btn.addEventListener("click", () => {
        if (progression.statPoints <= 0) return;
        progression.growth.state.baseStats[key] += 1;
        progression.statPoints -= 1;
        progression.growth.recalculate(progression.swordStage);
        battle.refreshDerivedStats();
        renderInnerWorld();
      });
      wrap.appendChild(btn);
      ui.statList.appendChild(wrap);
    });
  }

  function renderRewardPanel() {
    ui.rewardChoices.innerHTML = "";
    progression.currentRewards.forEach((reward) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<div>${reward.name}</div><small>${reward.desc}</small>`;
      btn.disabled = progression.innerWorld.rewardChosen;
      btn.addEventListener("click", () => {
        selectReward(reward);
        progression.innerWorld.rewardChosen = true;
        progression.innerWorld.step = "stats";
        renderInnerWorld();
      });
      ui.rewardChoices.appendChild(btn);
    });
    ui.rerollBtn.disabled = progression.coins <= 0 || progression.innerWorld.rewardChosen;
  }

  function selectReward(reward) {
    if (reward.type === "martialManual") {
      if (reward.payload.manualType === "external") progression.inventory.externalManualCount += 1;
      if (reward.payload.manualType === "internal") progression.inventory.internalManualCount += 1;
      if (reward.payload.manualType === "sword") progression.inventory.swordEnergyCount += 1;
    } else if (reward.type === "spellBook") {
      progression.inventory.spellBooks.push({ grade: reward.payload.grade, used: false });
    } else if (reward.type === "coin") {
      progression.coins += reward.payload.amount;
    }
    progression.growth.recalculate(progression.swordStage);
    battle.refreshDerivedStats();
  }

  function renderInnerWorld() {
    const step = progression.innerWorld.step;
    ui.innerStepText.textContent =
      step === "reward"
        ? "순서 1/6: 보상 선택"
        : step === "stats"
          ? "순서 2/6: 스탯 투자"
          : step === "skill"
            ? "순서 3/6: 무공서 사용"
            : step === "spellBook"
              ? "순서 4/6: 마법서 행동"
              : step === "shop"
                ? "순서 5/6: 상점"
          : step === "next"
            ? "순서 6/6: 다음 층 진입"
            : "회복";

    ui.rewardPanel.classList.toggle("hidden", step !== "reward");
    ui.statPanel.classList.toggle("hidden", step !== "stats");
    ui.manualPanel.classList.toggle("hidden", step !== "skill");
    ui.spellBookPanel.classList.toggle("hidden", step !== "spellBook");
    ui.shopPanel.classList.toggle("hidden", step !== "shop");
    ui.nextFloorBtn.classList.toggle("hidden", step !== "next");

    if (step === "reward") renderRewardPanel();
    if (step === "stats") renderStatPanel();
    if (step === "skill") {
      ui.manualCounts.textContent = `외공서 ${progression.inventory.externalManualCount} / 내공서 ${progression.inventory.internalManualCount} / 검기 ${progression.inventory.swordEnergyCount}`;
    }
    if (step === "spellBook") {
      ui.spellBookList.textContent = progression.inventory.spellBooks.length
        ? progression.inventory.spellBooks.map((b, i) => `${i + 1}. ${b.grade}${b.learned ? "(습득완료)" : ""}`).join(" | ")
        : "없음";
    }
  }

  ui.rerollBtn.addEventListener("click", () => {
    if (progression.coins <= 0 || progression.innerWorld.step !== "reward") return;
    progression.coins -= 1;
    progression.currentRewards = rerollRewards(progression.currentEnemyData);
    renderInnerWorld();
  });

  ui.statDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "stats") return;
    progression.innerWorld.statsDone = true;
    progression.innerWorld.step = "skill";
    renderInnerWorld();
  });

  ui.useExternalBtn.addEventListener("click", () => {
    useMartialManual(progression, progression.inventory, "external");
    battle.refreshDerivedStats();
    renderInnerWorld();
  });
  ui.useInternalBtn.addEventListener("click", () => {
    useMartialManual(progression, progression.inventory, "internal");
    battle.refreshDerivedStats();
    renderInnerWorld();
  });
  ui.useSwordBtn.addEventListener("click", () => {
    useMartialManual(progression, progression.inventory, "sword");
    battle.refreshDerivedStats();
    renderInnerWorld();
  });

  ui.manualDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "skill") return;
    progression.innerWorld.step = "spellBook";
    renderInnerWorld();
  });

  ui.learnSpellBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "spellBook") return;
    attemptLearnSpellBook(progression, progression.inventory, false);
    renderInnerWorld();
  });

  ui.extraLearnBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "spellBook") return;
    if (progression.coins <= 0) return;
    progression.coins -= 1;
    attemptLearnSpellBook(progression, progression.inventory, true);
    renderInnerWorld();
  });

  ui.spellBookDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "spellBook") return;
    progression.innerWorld.step = "shop";
    renderInnerWorld();
  });

  function shopCtx() {
    return { canTrade: progression.innerWorld.step === "shop", progression, inventory: progression.inventory };
  }
  ui.buyExternalBtn.addEventListener("click", () => { buyShopItem(shopCtx(), "buy_external"); renderInnerWorld(); });
  ui.buyInternalBtn.addEventListener("click", () => { buyShopItem(shopCtx(), "buy_internal"); renderInnerWorld(); });
  ui.buySwordBtn.addEventListener("click", () => { buyShopItem(shopCtx(), "buy_sword"); renderInnerWorld(); });
  ui.buyTicketBtn.addEventListener("click", () => { buyShopItem(shopCtx(), "buy_ticket"); renderInnerWorld(); });
  ui.sellExternalBtn.addEventListener("click", () => { sellShopItem(shopCtx(), "sell_external"); renderInnerWorld(); });
  ui.sellInternalBtn.addEventListener("click", () => { sellShopItem(shopCtx(), "sell_internal"); renderInnerWorld(); });
  ui.sellSwordBtn.addEventListener("click", () => { sellShopItem(shopCtx(), "sell_sword"); renderInnerWorld(); });
  ui.drawTicketBtn.addEventListener("click", () => {
    const result = drawMartialManualTicket(shopCtx());
    if (!result) return;
    if (result.manualType === "external") progression.inventory.externalManualCount += 1;
    if (result.manualType === "internal") progression.inventory.internalManualCount += 1;
    if (result.manualType === "sword") progression.inventory.swordEnergyCount += 1;
    renderInnerWorld();
  });
  ui.shopDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "shop") return;
    progression.innerWorld.step = "next";
    renderInnerWorld();
  });

  ui.nextFloorBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "next") return;
    leaveInnerWorldToNextFloor();
  });


  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;

    const moveInput = input.getMoveInput();
    const eState = battle.getEnemyState();
    let baseForward = camera.getForwardRay().direction;
    baseForward.y = 0;
    if (baseForward.lengthSquared() > 0) baseForward.normalize();
    let baseRight = BABYLON.Vector3.Cross(BABYLON.Axis.Y, baseForward).normalize();
    if (battle.isLockOnActive() && eState.mesh && gameMode === MAP_STATE.FLOOR_COMBAT) {
      baseForward = eState.mesh.position.subtract(player.position);
      baseForward.y = 0;
      if (baseForward.lengthSquared() > 0) baseForward.normalize();
      baseRight = BABYLON.Vector3.Cross(BABYLON.Axis.Y, baseForward).normalize();
    }

    const moveDir = baseRight.scale(moveInput.x).add(baseForward.scale(moveInput.y));
    if (moveDir.lengthSquared() > 0) {
      moveDir.normalize();
      const yaw = Math.atan2(moveDir.x, moveDir.z);
      const target = BABYLON.Quaternion.FromEulerAngles(0, yaw, 0);
      player.rotationQuaternion = BABYLON.Quaternion.Slerp(player.rotationQuaternion, target, Math.min(1, dt * 10));
    }

    const actions = input.consumeActions();
    if (actions.lockToggle && gameMode === MAP_STATE.FLOOR_COMBAT) {
      battle.toggleLockOn();
    }
    if (gameMode === MAP_STATE.FLOOR_COMBAT) {
      battle.update(dt, moveDir, actions);
    }

    const pState = battle.getPlayerState();
    if (
      gameMode === MAP_STATE.FLOOR_COMBAT &&
      !pState.dodging &&
      battle.getPhase() === "playing" &&
      moveDir.lengthSquared() > 0
    ) {
      player.position.addInPlace(moveDir.scale(pState.moveSpeed * dt));
      battle.clampAllInsideArena();
    }

    battle.setPlayerEmissive(playerMat);
    if (battle.isLockOnActive() && eState.mesh && gameMode === MAP_STATE.FLOOR_COMBAT) {
      const center = player.position.add(eState.mesh.position).scale(0.5);
      camera.setTarget(center);
      const dist = BABYLON.Vector3.Distance(player.position, eState.mesh.position);
      camera.radius = Math.min(16, Math.max(8, dist * 1.8));
      camera.beta = Math.PI / 3.1;
    } else {
      camera.setTarget(player.position);
    }

    hud.floorInfo.textContent = `Floor: ${progression.floor}`;
    hud.progressInfo.textContent = `Lv ${progression.level} | Stat Pts ${progression.statPoints} | Coin ${progression.coins}`;
    hud.playerHp.textContent = `플레이어 HP: ${Math.ceil(pState.hp)} / ${Math.ceil(pState.maxHp)}`;
    hud.playerMp.textContent = `플레이어 MP: ${Math.ceil(pState.mp)} / ${Math.ceil(pState.maxMp)}`;
    hud.enemyHp.textContent =
      gameMode === MAP_STATE.FLOOR_COMBAT
        ? `적 HP: ${Math.ceil(eState.hp)} / ${Math.ceil(eState.maxHp)}`
        : "적 HP: -";
    hud.mantraInfo.textContent = `만트라: ${progression.mantra}`;
    const equippedSpell = progression.spellSlots.known.find((s) => s.id === progression.spellSlots.equipped);
    hud.spellInfo.textContent = `마법: ${equippedSpell ? equippedSpell.name : "-"}`;
    hud.manualInfo.textContent = `외공서 ${progression.inventory.externalManualCount} | 내공서 ${progression.inventory.internalManualCount} | 검기 ${progression.inventory.swordEnergyCount}`;
    const swordData = SWORD_STAGE_DATA[progression.swordStage] || SWORD_STAGE_DATA[0];
    hud.swordStageInfo.textContent = `검기 단계: ${swordData.name} (${progression.swordStage})`;
    hud.actionFeedback.textContent = pState.feedback;
    input.setActionButtonsState({ ...battle.getCooldownState(), locked: battle.isLockOnActive() });

    if (gameMode === MAP_STATE.FLOOR_COMBAT && battle.getPhase() === "clear") {
      hud.battleMessage.textContent = "층 클리어";
      if (!progression.innerWorld.active) {
        progression.currentEnemyData = battle.getEnemyDescriptor();
        enterInnerWorld();
      }
    } else if (gameMode === MAP_STATE.FLOOR_COMBAT && battle.getPhase() === "defeat") {
      hud.battleMessage.textContent = "패배";
      input.setEnabled(false);
    } else {
      hud.battleMessage.textContent = "";
    }
    if (gameMode === MAP_STATE.INNER_WORLD && battle.isLockOnActive()) {
      battle.toggleLockOn();
    }
  });

  return scene;
}

const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
