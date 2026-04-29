const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);

const BASE_STATS = {
  strength: 1,
  agility: 1,
  appearance: 1,
  vitality: 1,
  intelligence: 1,
  wisdom: 1,
};

const COMBAT_STATE = {
  COMBAT_READY: "COMBAT_READY",
  COMBAT_ACTIVE: "COMBAT_ACTIVE",
  PLAYER_DEAD: "PLAYER_DEAD",
  ENEMY_DEAD: "ENEMY_DEAD",
  INNER_WORLD: "INNER_WORLD",
};

const GAME_STATE = {
  TITLE: "TITLE",
  CHARACTER_CREATION: "CHARACTER_CREATION",
  CHARACTER_CONFIRM: "CHARACTER_CONFIRM",
  FLOOR_COMBAT: "FLOOR_COMBAT",
  INNER_WORLD: "INNER_WORLD",
  GAME_OVER: "GAME_OVER",
};
const DEBUG_MODE = true;

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
    multiCastingCount: 0,
    equippedMagicId: null,
    mantra: "화염",
    profile: {
      name: "",
      gender: "",
      worldDestructionCause: "",
      destroyer: "",
      finalMoment: "",
      goal: "",
    },
    originalMana: { name: "", type: "", description: "" },
    growth,
    inventory: createInventoryState(),
    currentRewards: [],
    rewardDrawTicketCount: 0,
    currentEnemyData: { skills: [] },
    innerWorld: createInnerWorldState(),
    skills: createSkillState(),
    manualUseCounts: { external: 0, internal: 0 },
  };
}

function createInputController(scene) {
  const keys = { w: false, a: false, s: false, d: false };
  const action = { attackPressed: false, dodgePressed: false, guardHeld: false, magicPressed: false, lockToggle: false, skillPressed: false, skillSelectPressed: false };
  let enabled = true;

  const joystickRoot = document.getElementById("mobileJoystick");
  const joystickBase = document.getElementById("joystickBase");
  const joystickKnob = document.getElementById("joystickKnob");
  const attackBtn = document.getElementById("attackBtn");
  const dodgeBtn = document.getElementById("dodgeBtn");
  const guardBtn = document.getElementById("guardBtn");
  const magicBtn = document.getElementById("magicBtn");
  const lockBtn = document.getElementById("lockBtn");
  const skillBtn = document.getElementById("skillBtn");
  const skillSelectBtn = document.getElementById("skillSelectBtn");

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
      action.skillPressed = false;
      action.skillSelectPressed = false;
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
  bindPressButton(
    skillBtn,
    () => (action.skillPressed = true),
    () => {}
  );
  bindPressButton(
    skillSelectBtn,
    () => (action.skillSelectPressed = true),
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
    if (code === "KeyE" && isDown) action.skillPressed = true;
    if (code === "KeyC" && isDown) action.skillSelectPressed = true;
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
      action.skillPressed = false;
      action.skillSelectPressed = false;
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
      skillBtn.disabled = !state.skill;
      skillSelectBtn.disabled = !state.skillSelect;
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
    moveSpeed: 4.5, attackDamage: 20, critChance: 0,
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
    const d = progression.growth.recalculate(progression.swordStage, progression.level, progression.manualUseCounts, progression.multiCastingCount);
    playerState.maxHp = d.maxHp;
    playerState.maxMp = d.maxMp;
    playerState.mpRegen = d.mpRegen;
    playerState.moveSpeed = d.moveSpeed;
    playerState.attackDamage = d.attackDamage;
    playerState.critChance = 0;
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
    const spell = progression.inventory.magicList.find((s) => s.id === progression.equippedMagicId);
    if (!spell) { playerState.feedback = "장착 마법 없음"; playerState.feedbackTimer = 0.2; return { casted: false }; }
    if (playerState.mp < spell.mpCost) { playerState.feedback = "MP 부족"; playerState.feedbackTimer = 0.2; return { casted: false }; }
    playerState.mp -= spell.mpCost; playerState.feedback = "마법"; playerState.feedbackTimer = 0.2;
    const forward = getFacing(player);
    const magicBase = spell.damage || 0;

    if (spell.type === "heal") {
      playerState.hp = Math.min(playerState.maxHp, playerState.hp + 120);
      return { casted: true, mpCost: spell.mpCost };
    }
    if (spell.type === "shield") {
      playerState.guardHeld = true;
      playerState.feedback = "보호막";
      return { casted: true, mpCost: spell.mpCost };
    }
    if (spell.type === "movement") {
      player.position.addInPlace(forward.scale(2.4));
      clampInsideArena(player.position);
      return { casted: true, mpCost: spell.mpCost };
    }
    if (spell.type === "instant") {
      if (enemy) dealDamageToEnemy(magicBase);
      return { casted: true, mpCost: spell.mpCost };
    }

    if (spell.type === "projectile" || spell.type === "summon") {
      const b = BABYLON.MeshBuilder.CreateSphere(`magic_${Date.now()}`, { diameter: 0.32 }, scene);
      b.position = player.position.add(forward.scale(0.9)).add(new BABYLON.Vector3(0, 0.6, 0));
      const m = new BABYLON.StandardMaterial(`magicMat_${Date.now()}`, scene); m.emissiveColor = new BABYLON.Color3(1, 0.45, 0.18); b.material = m;
      projectileState.push({ mesh: b, dir: forward, speed: 14, remain: 14, damage: magicBase });
      return { casted: true, mpCost: spell.mpCost };
    }

    // area/beam/field/debuff/buff 기본 처리: 전방 범위 타격 또는 상태효과 틀
    if (enemy) {
      const toEnemy = enemy.position.subtract(player.position); toEnemy.y = 0;
      if (toEnemy.length() <= 4.2) {
        dealDamageToEnemy(magicBase * 0.9);
      }
    }
    return { casted: true, mpCost: spell.mpCost };
  }

  function getSkillPower(skill) {
    const base = progression.growth.state.officialDerivedStats?.basicAttackDamage
      || progression.growth.state.derivedStats.attackDamage
      || playerState.attackDamage
      || 1;
    return Math.max(1, Math.floor(base * (skill.tierMultiplier || 1)));
  }

  function castSkill(skill) {
    const nowSec = performance.now() / 1000;
    const usable = canUseSkill(skill, playerState, nowSec, progression);
    if (!usable.ok) {
      playerState.feedback = usable.reason === "mp" ? "MP 부족" : "스킬 대기중";
      playerState.feedbackTimer = 0.24;
      return false;
    }

    playerState.mp -= skill.mpCost;
    const forward = getFacing(player);
    const skillPower = getSkillPower(skill);
    const type = skill.type;

    if (type === "melee") {
      if (enemy) {
        const toEnemy = enemy.position.subtract(player.position);
        toEnemy.y = 0;
        if (toEnemy.length() <= 2.3) {
          toEnemy.normalize();
          if (BABYLON.Vector3.Dot(forward, toEnemy) >= 0.05) {
            dealDamageToEnemy(skillPower);
          }
        }
      }
    } else if (type === "projectile") {
      const b = BABYLON.MeshBuilder.CreateSphere(`skill_${Date.now()}`, { diameter: 0.4 }, scene);
      b.position = player.position.add(forward.scale(0.95)).add(new BABYLON.Vector3(0, 0.7, 0));
      const m = new BABYLON.StandardMaterial(`skillMat_${Date.now()}`, scene);
      m.emissiveColor = skill.isMandala ? new BABYLON.Color3(0.9, 0.3, 1) : new BABYLON.Color3(0.3, 0.8, 1);
      b.material = m;
      projectileState.push({ mesh: b, dir: forward, speed: 16, remain: 16, damage: skillPower * (skill.isMandala ? 1.2 : 1) });
    } else if (type === "area") {
      if (enemy) {
        const dist = BABYLON.Vector3.Distance(player.position, enemy.position);
        if (dist <= (skill.isMandala ? 6 : 4.4)) {
          dealDamageToEnemy(skillPower * (skill.isMandala ? 1.25 : 1));
        }
      }
      spawnFx(player.position.add(new BABYLON.Vector3(0, 0.4, 0)), new BABYLON.Color3(0.7, 0.7, 1));
    } else if (type === "buff") {
      playerState.attackDamage += Math.max(1, Math.floor(skillPower * 0.08));
      playerState.moveSpeed += 0.25;
    } else if (type === "defense") {
      playerState.guardHeld = true;
      playerState.invincible = true;
      setTimeout(() => {
        playerState.invincible = false;
      }, 900);
    } else if (type === "movement") {
      player.position.addInPlace(forward.scale(skill.isMandala ? 4.4 : 3.4));
      clampInsideArena(player.position);
    }

    markSkillUsed(skill, nowSec, progression);
    playerState.feedback = `${skill.name} 발동`;
    playerState.feedbackTimer = 0.3;
    return true;
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
      if (actions.magicPressed && playerState.magicCooldown <= 0) {
        const result = castMagic();
        if (result.casted) {
          const reduction = Math.min(1, progression.multiCastingCount * 0.1);
          playerState.magicCooldown = result.mpCost * 0.03 * (1 - reduction);
        }
      }
      if (actions.skillSelectPressed) {
        selectNextBattleSkill(progression);
      }
      if (actions.skillPressed) {
        const slotId = progression.skills.selectedSlotId;
        const skill = slotId ? progression.skills.slots[slotId] : null;
        if (skill) castSkill(skill);
        else {
          playerState.feedback = "사용 가능한 스킬 없음";
          playerState.feedbackTimer = 0.2;
        }
      }
      if (playerState.attackTimer > 0) {
        playerState.attackTimer -= delta;
        if (!playerState.attackHitDone && enemy) {
          const toEnemy = enemy.position.subtract(player.position); toEnemy.y = 0;
          if (toEnemy.length() <= 1.85) { toEnemy.normalize(); if (BABYLON.Vector3.Dot(getFacing(player), toEnemy) > 0.2) { dealDamageToEnemy(playerState.attackDamage); playerState.attackHitDone = true; } }
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
    getSnapshot() {
      return {
        playerHp: playerState.hp,
        playerMp: playerState.mp,
        enemyHp: enemyState.hp,
        phase: battle.phase,
      };
    },
    applySnapshot(snapshot) {
      if (!snapshot) return;
      if (typeof snapshot.playerHp === "number") playerState.hp = Math.max(0, Math.min(playerState.maxHp, snapshot.playerHp));
      if (typeof snapshot.playerMp === "number") playerState.mp = Math.max(0, Math.min(playerState.maxMp, snapshot.playerMp));
      if (typeof snapshot.enemyHp === "number") enemyState.hp = Math.max(0, Math.min(enemyState.maxHp, snapshot.enemyHp));
      if (typeof snapshot.phase === "string") battle.phase = snapshot.phase;
    },
    getCooldownState() {
      const equipped = progression.inventory.magicList.find((s) => s.id === progression.equippedMagicId);
      const mpCost = equipped ? equipped.mpCost : 99999;
      const selectedSkill = progression.skills.selectedSlotId ? progression.skills.slots[progression.skills.selectedSlotId] : null;
      const nowSec = performance.now() / 1000;
      const skillOk = selectedSkill ? canUseSkill(selectedSkill, playerState, nowSec, progression).ok : false;
      return {
        attack: playerState.attackCooldown <= 0,
        dodge: playerState.dodgeCooldown <= 0 && !playerState.dodging,
        magic: playerState.magicCooldown <= 0 && playerState.mp >= mpCost,
        skill: skillOk,
        skillSelect: !!getCreatedSkills(progression).length,
      };
    },
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
  let gameMode = null;
  let gameState = GAME_STATE.TITLE;

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
  mapManager.clearCurrentMap();
  const innerInteractables = [];
  let activeInnerPanel = null;

  const hud = {
    floorInfo: document.getElementById("floorInfo"),
    progressInfo: document.getElementById("progressInfo"),
    playerHp: document.getElementById("playerHp"),
    playerMp: document.getElementById("playerMp"),
    enemyHp: document.getElementById("enemyHp"),
    mantraInfo: document.getElementById("mantraInfo"),
    spellInfo: document.getElementById("spellInfo"),
    skillInfo: document.getElementById("skillInfo"),
    skillCooldownInfo: document.getElementById("skillCooldownInfo"),
    magicCooldownInfo: document.getElementById("magicCooldownInfo"),
    manualInfo: document.getElementById("manualInfo"),
    swordStageInfo: document.getElementById("swordStageInfo"),
    battleMessage: document.getElementById("battleMessage"),
    actionFeedback: document.getElementById("actionFeedback"),
  };

  const ui = {
    titleScreen: document.getElementById("titleScreen"),
    startGameBtn: document.getElementById("startGameBtn"),
    continueGameBtn: document.getElementById("continueGameBtn"),
    characterCreation: document.getElementById("characterCreation"),
    ccStepText: document.getElementById("ccStepText"),
    ccError: document.getElementById("ccError"),
    ccStepName: document.getElementById("ccStepName"),
    ccStepStats: document.getElementById("ccStepStats"),
    ccStepMantra: document.getElementById("ccStepMantra"),
    ccStepOriginalMana: document.getElementById("ccStepOriginalMana"),
    ccStepLore: document.getElementById("ccStepLore"),
    ccStepConfirm: document.getElementById("ccStepConfirm"),
    charNameInput: document.getElementById("charNameInput"),
    charGenderInput: document.getElementById("charGenderInput"),
    ccRemainPoints: document.getElementById("ccRemainPoints"),
    ccStatInputs: document.getElementById("ccStatInputs"),
    mantraPresetButtons: document.getElementById("mantraPresetButtons"),
    manaPresetButtons: document.getElementById("manaPresetButtons"),
    mantraNameInput: document.getElementById("mantraNameInput"),
    mantraCategoryInput: document.getElementById("mantraCategoryInput"),
    mantraDescInput: document.getElementById("mantraDescInput"),
    manaNameInput: document.getElementById("manaNameInput"),
    manaTypeInput: document.getElementById("manaTypeInput"),
    manaDescInput: document.getElementById("manaDescInput"),
    worldCauseInput: document.getElementById("worldCauseInput"),
    destroyerInput: document.getElementById("destroyerInput"),
    finalMomentInput: document.getElementById("finalMomentInput"),
    goalInput: document.getElementById("goalInput"),
    characterSheetPreview: document.getElementById("characterSheetPreview"),
    ccBackBtn: document.getElementById("ccBackBtn"),
    ccNextBtn: document.getElementById("ccNextBtn"),
    ccEditBtn: document.getElementById("ccEditBtn"),
    enterFloorBtn: document.getElementById("enterFloorBtn"),
    inner: document.getElementById("innerWorld"),
    innerStepText: document.getElementById("innerStepText"),
    rewardPanel: document.getElementById("rewardPanel"),
    rewardChoices: document.getElementById("rewardChoices"),
    rerollBtn: document.getElementById("rerollBtn"),
    statPanel: document.getElementById("statPanel"),
    statList: document.getElementById("statList"),
    statDoneBtn: document.getElementById("statDoneBtn"),
    skillCreatePanel: document.getElementById("skillCreatePanel"),
    pendingSkillText: document.getElementById("pendingSkillText"),
    skillNameInput: document.getElementById("skillNameInput"),
    autoSkillNameBtn: document.getElementById("autoSkillNameBtn"),
    skillTypeSelect: document.getElementById("skillTypeSelect"),
    skillAttributeSelect: document.getElementById("skillAttributeSelect"),
    skillDescInput: document.getElementById("skillDescInput"),
    createSkillBtn: document.getElementById("createSkillBtn"),
    skillCreateResult: document.getElementById("skillCreateResult"),
    nextFloorBtn: document.getElementById("nextFloorBtn"),
    manualPanel: document.getElementById("manualPanel"),
    manualCounts: document.getElementById("manualCounts"),
    useExternalBtn: document.getElementById("useExternalBtn"),
    useInternalBtn: document.getElementById("useInternalBtn"),
    useSwordBtn: document.getElementById("useSwordBtn"),
    manualDoneBtn: document.getElementById("manualDoneBtn"),
    spellBookPanel: document.getElementById("spellBookPanel"),
    spellBookList: document.getElementById("spellBookList"),
    learnResult: document.getElementById("learnResult"),
    learnedMagicList: document.getElementById("learnedMagicList"),
    learnSpellBtn: document.getElementById("learnSpellBtn"),
    extraLearnBtn: document.getElementById("extraLearnBtn"),
    spellBookDoneBtn: document.getElementById("spellBookDoneBtn"),
    shopPanel: document.getElementById("shopPanel"),
    buyExternalBtn: document.getElementById("buyExternalBtn"),
    buyInternalBtn: document.getElementById("buyInternalBtn"),
    buySwordBtn: document.getElementById("buySwordBtn"),
    buyTicketBtn: document.getElementById("buyTicketBtn"),
    buySkillResetBtn: document.getElementById("buySkillResetBtn"),
    drawTicketBtn: document.getElementById("drawTicketBtn"),
    sellExternalBtn: document.getElementById("sellExternalBtn"),
    sellInternalBtn: document.getElementById("sellInternalBtn"),
    sellSwordBtn: document.getElementById("sellSwordBtn"),
    shopDoneBtn: document.getElementById("shopDoneBtn"),
    debugMenu: document.getElementById("debugMenu"),
    debugSaveBtn: document.getElementById("debugSaveBtn"),
    debugLoadBtn: document.getElementById("debugLoadBtn"),
    debugClearBtn: document.getElementById("debugClearBtn"),
    debugCoinBtn: document.getElementById("debugCoinBtn"),
    debugLevelBtn: document.getElementById("debugLevelBtn"),
    debugInnerBtn: document.getElementById("debugInnerBtn"),
    debugNextFloorBtn: document.getElementById("debugNextFloorBtn"),
  };
  const magicSelect = document.getElementById("magicSelect");
  const actionButtonsWrap = document.getElementById("actionButtons");
  const joystickWrap = document.getElementById("mobileJoystick");
  const characterForm = resetCharacterCreationForm();
  ui.buyTicketBtn.textContent = `무공서 뽑기권 구매(${MANUAL_TICKET_PRICE}코인)`;
  setSkillPlayerContext(progression);
  SKILL_TYPES.forEach((type) => {
    const op = document.createElement("option");
    op.value = type;
    op.textContent = type;
    ui.skillTypeSelect.appendChild(op);
  });
  SKILL_ATTRIBUTES.forEach((attr) => {
    const op = document.createElement("option");
    op.value = attr;
    op.textContent = attr;
    ui.skillAttributeSelect.appendChild(op);
  });

  function applyGameplayVisibility(isCombat) {
    document.getElementById("hud").classList.toggle("hidden", !isCombat);
    actionButtonsWrap.classList.toggle("hidden", !isCombat);
    joystickWrap.classList.toggle("hidden", !isCombat);
  }
  ui.debugMenu.classList.toggle("hidden", !DEBUG_MODE);

  function buildSavePayload(trigger = "manual") {
    const snapshot = battle.getSnapshot();
    return {
      version: SAVE_VERSION,
      trigger,
      gameState,
      progression: {
        profile: { ...progression.profile },
        level: progression.level,
        floor: progression.floor,
        coins: progression.coins,
        statPoints: progression.statPoints,
        growth: {
          baseStats: { ...progression.growth.state.baseStats },
          officialDerivedStats: { ...(progression.growth.state.officialDerivedStats || {}) },
        },
        hp: snapshot.playerHp,
        mp: snapshot.playerMp,
        mantra: progression.mantra,
        originalMana: { ...progression.originalMana },
        inventory: {
          externalManualCount: progression.inventory.externalManualCount,
          internalManualCount: progression.inventory.internalManualCount,
          swordEnergyCount: progression.inventory.swordEnergyCount,
          spellBooks: [...progression.inventory.spellBooks],
          grimoires: [...(progression.inventory.grimoires || [])],
          magicList: [...progression.inventory.magicList],
          martialManualTicket: progression.inventory.martialManualTicket,
          skillResetTicketCount: progression.inventory.skillResetTicketCount,
        },
        manualUseCounts: { ...progression.manualUseCounts },
        swordStage: progression.swordStage,
        multiCastingCount: progression.multiCastingCount,
        skills: JSON.parse(JSON.stringify(progression.skills)),
        equippedMagicId: progression.equippedMagicId,
        innerWorld: { ...progression.innerWorld },
        floorState: {
          ...snapshot,
          currentEnemyData: { ...progression.currentEnemyData },
        },
        rewardDrawTicketCount: progression.rewardDrawTicketCount || 0,
        activeInnerPanel: activeInnerPanel || null,
      },
    };
  }

  function autosave(trigger) {
    saveCharacter(buildSavePayload(trigger));
    ui.continueGameBtn.disabled = !hasSavedCharacter();
  }

  function applyLoadedProgression(data) {
    const p = data.progression;
    progression.profile = { ...p.profile };
    progression.level = p.level;
    progression.floor = p.floor;
    progression.coins = p.coins;
    progression.statPoints = p.statPoints;
    progression.mantra = p.mantra;
    progression.originalMana = { ...p.originalMana };
    progression.inventory.externalManualCount = p.inventory.externalManualCount;
    progression.inventory.internalManualCount = p.inventory.internalManualCount;
    progression.inventory.swordEnergyCount = p.inventory.swordEnergyCount;
    progression.inventory.spellBooks = [...(p.inventory.spellBooks || [])];
    progression.inventory.grimoires = [...(p.inventory.grimoires || [])];
    progression.inventory.magicList = [...(p.inventory.magicList || [])];
    progression.inventory.martialManualTicket = p.inventory.martialManualTicket || 0;
    progression.inventory.skillResetTicketCount = p.inventory.skillResetTicketCount || 0;
    progression.swordStage = p.swordStage || 0;
    progression.manualUseCounts = { ...p.manualUseCounts };
    progression.multiCastingCount = p.multiCastingCount || 1;
    progression.skills = p.skills || createSkillState();
    progression.equippedMagicId = p.equippedMagicId || null;
    progression.innerWorld = { ...progression.innerWorld, ...(p.innerWorld || {}) };
    progression.currentEnemyData = { ...(p.floorState?.currentEnemyData || progression.currentEnemyData) };
    progression.rewardDrawTicketCount = p.rewardDrawTicketCount || 0;
    activeInnerPanel = p.activeInnerPanel || null;
    progression.growth.state.baseStats = { ...progression.growth.state.baseStats, ...(p.growth?.baseStats || {}) };
    progression.growth.recalculate(progression.swordStage, progression.level, progression.manualUseCounts, progression.multiCastingCount);
    progression.growth.state.officialDerivedStats = { ...(p.growth?.officialDerivedStats || {}) };
    setSkillPlayerContext(progression);
    battle.refreshDerivedStats();
    battle.applySnapshot({ playerHp: p.hp, playerMp: p.mp });
    refreshMagicSelect();
  }

  function restoreFromSaveRecord(record) {
    if (!record || !record.ok) return false;
    applyLoadedProgression(record.data);
    gameState = record.data.gameState || GAME_STATE.TITLE;

    if (gameState === GAME_STATE.FLOOR_COMBAT) {
      ui.titleScreen.classList.add("hidden");
      ui.characterCreation.classList.add("hidden");
      ui.inner.classList.add("hidden");
      applyGameplayVisibility(true);
      input.setEnabled(true);
      battle.setupForFloor(progression.floor);
      const floorMap = mapManager.showFloorCombatMap(battle.getEnemyDescriptor(), { floor: progression.floor, level: progression.level });
      battle.setArenaRadius(floorMap.bounds?.arenaRadius || 8.2);
      battle.applySnapshot(record.data.progression.floorState);
      gameMode = MAP_STATE.FLOOR_COMBAT;
      return true;
    }
    if (gameState === GAME_STATE.INNER_WORLD) {
      ui.titleScreen.classList.add("hidden");
      ui.characterCreation.classList.add("hidden");
      applyGameplayVisibility(true);
      input.setEnabled(true);
      ui.inner.classList.remove("hidden");
      mapManager.showInnerWorldMap({ floor: progression.floor, level: progression.level });
      spawnInnerWorldInteractables();
      battle.despawnEnemy();
      player.position.set(0, 1, 0);
      gameMode = MAP_STATE.INNER_WORLD;
      renderInnerWorld();
      return true;
    }
    if (gameState === GAME_STATE.GAME_OVER) {
      applyGameplayVisibility(false);
      input.setEnabled(false);
      ui.titleScreen.classList.remove("hidden");
      ui.characterCreation.classList.add("hidden");
      ui.inner.classList.add("hidden");
      return true;
    }
    return false;
  }

  function renderCharacterSheetPreview() {
    const tempPlayer = createPlayerFromCharacterForm(characterForm);
    const statCap = getStatCap(1);
    const lines = [
      `[캐릭터 정보]`,
      `이름: ${tempPlayer.profile.name}`,
      `성별: ${tempPlayer.profile.gender}`,
      `세계 멸망 원인: ${tempPlayer.profile.worldDestructionCause}`,
      `멸망시킨 존재: ${tempPlayer.profile.destroyer}`,
      `마지막 순간: ${tempPlayer.profile.finalMoment}`,
      `목표: ${tempPlayer.profile.goal}`,
      ``,
      `[레벨]`,
      `Lv 1`,
      ``,
      `[능력치]`,
      `힘 ${tempPlayer.officialPrimary.strength} / 민첩 ${tempPlayer.officialPrimary.agility} / 외모 ${tempPlayer.officialPrimary.appearance}`,
      `지능 ${tempPlayer.officialPrimary.intelligence} / 체력 ${tempPlayer.officialPrimary.vitality} / 지혜 ${tempPlayer.officialPrimary.wisdom}`,
      `남은 스탯 포인트 0`,
      `현재 기본 스탯 최대치 ${statCap}`,
      ``,
      `[파생 수치]`,
      `최대 HP ${tempPlayer.officialDerivedStats.maxHp} / 현재 HP ${tempPlayer.hp}`,
      `최대 MP ${tempPlayer.officialDerivedStats.maxMp} / 현재 MP ${tempPlayer.mp}`,
      `MP 회복 ${tempPlayer.officialDerivedStats.mpRegen}`,
      `평타 피해 ${tempPlayer.officialDerivedStats.basicAttackDamage}`,
      `멀티케스팅 수 ${tempPlayer.officialDerivedStats.multiCastingCount}`,
      ``,
      `[만트라] ${characterForm.mantra.name} | ${characterForm.mantra.category} | ${characterForm.mantra.description}`,
      `[오리지널 마나] ${characterForm.originalMana.name} | ${characterForm.originalMana.type} | ${characterForm.originalMana.description}`,
      `[스킬] 없음`,
      `[마법] 없음 (기본 지급 없음)`,
      `[무공서] 외공서 0 / 내공서 0 / 검기 0 / 검기 단계 없음`,
      `[마법서] 없음`,
      `[코인] 0`,
    ];
    ui.characterSheetPreview.textContent = lines.join("\n");
  }

  function renderCharacterCreation() {
    const step = CHARACTER_CREATION_STEPS[characterForm.stepIndex];
    ui.ccStepText.textContent = `${characterForm.stepIndex + 1}/${CHARACTER_CREATION_STEPS.length}`;
    ui.ccStepName.classList.toggle("hidden", step !== "name");
    ui.ccStepStats.classList.toggle("hidden", step !== "stats");
    ui.ccStepMantra.classList.toggle("hidden", step !== "mantra");
    ui.ccStepOriginalMana.classList.toggle("hidden", step !== "originalMana");
    ui.ccStepLore.classList.toggle("hidden", step !== "lore");
    ui.ccStepConfirm.classList.toggle("hidden", step !== "confirm");
    ui.ccEditBtn.classList.toggle("hidden", step !== "confirm");
    ui.enterFloorBtn.classList.toggle("hidden", step !== "confirm");
    ui.ccNextBtn.classList.toggle("hidden", step === "confirm");
    ui.ccBackBtn.disabled = characterForm.stepIndex === 0;
    if (step === "stats") {
      const sum = CHARACTER_CREATION_STAT_KEYS.reduce((a, k) => a + Number(characterForm.statAllocation[k] || 0), 0);
      ui.ccRemainPoints.textContent = `총합 ${sum} / 54 | 남은 포인트 ${54 - sum}`;
    }
    if (step === "confirm") renderCharacterSheetPreview();
  }

  function openCharacterCreation() {
    gameState = GAME_STATE.CHARACTER_CREATION;
    ui.titleScreen.classList.add("hidden");
    ui.characterCreation.classList.remove("hidden");
    ui.inner.classList.add("hidden");
    applyGameplayVisibility(false);
    input.setEnabled(false);
    renderCharacterCreation();
  }

  function startNewGame() {
    if (hasSavedCharacter()) {
      const ok = window.confirm("기존 저장 데이터가 있습니다. 새 게임을 시작하면 삭제됩니다. 진행할까요?");
      if (!ok) return;
      clearSave();
      ui.continueGameBtn.disabled = true;
    }
    Object.assign(characterForm, resetCharacterCreationForm());
    ui.ccError.textContent = "";
    renderCharacterCreation();
    openCharacterCreation();
  }

  function applyCreatedCharacterToProgression(created) {
    progression.profile = { ...created.profile };
    progression.mantra = created.mantra.name;
    progression.originalMana = { ...created.originalMana };
    progression.level = 1;
    progression.floor = 1;
    progression.coins = 0;
    progression.statPoints = 0;
    progression.multiCastingCount = 1;
    progression.inventory.externalManualCount = 0;
    progression.inventory.internalManualCount = 0;
    progression.inventory.swordEnergyCount = 0;
    progression.inventory.spellBooks = [];
    progression.inventory.magicList = [];
    progression.inventory.skillResetTicketCount = 0;
    progression.swordStage = 0;
    progression.manualUseCounts = { external: 0, internal: 0 };
    progression.skills = createSkillState();
    setSkillPlayerContext(progression);

    progression.growth.state.baseStats = { ...created.baseStats };
    progression.growth.recalculate(0, progression.level, progression.manualUseCounts, progression.multiCastingCount);
    progression.growth.state.officialDerivedStats = { ...created.officialDerivedStats };
    progression.hp = created.hp;
    progression.mp = created.mp;
  }

  function enterFirstFloor() {
    if (gameState !== GAME_STATE.CHARACTER_CONFIRM) return;
    ui.characterCreation.classList.add("hidden");
    applyGameplayVisibility(true);
    input.setEnabled(true);
    battle.setupForFloor(progression.floor);
    const floorMap = mapManager.showFloorCombatMap(battle.getEnemyDescriptor(), { floor: progression.floor, level: progression.level });
    battle.setArenaRadius(floorMap.bounds?.arenaRadius || 8.2);
    camera.radius = 11;
    camera.beta = Math.PI / 3.2;
    gameState = GAME_STATE.FLOOR_COMBAT;
    gameMode = MAP_STATE.FLOOR_COMBAT;
    autosave("enter_first_floor");
  }
  window.startNewGame = startNewGame;
  window.openCharacterCreation = openCharacterCreation;
  window.enterFirstFloor = enterFirstFloor;

  function clearInnerInteractables() {
    innerInteractables.forEach((x) => x.mesh?.dispose());
    innerInteractables.length = 0;
  }
  function spawnInnerWorldInteractables() {
    clearInnerInteractables();
    const defs = [
      { id: "reward", label: "보상 뽑기 장치", pos: new BABYLON.Vector3(-3, 1, 0), color: new BABYLON.Color3(0.2, 0.8, 1) },
      { id: "storage", label: "저장고", pos: new BABYLON.Vector3(3, 1, 0), color: new BABYLON.Color3(0.4, 1, 0.5) },
      { id: "shop", label: "상점", pos: new BABYLON.Vector3(0, 1, -3), color: new BABYLON.Color3(1, 0.8, 0.3) },
      { id: "training", label: "연습실", pos: new BABYLON.Vector3(0, 1, 3), color: new BABYLON.Color3(0.9, 0.4, 1) },
      { id: "statue", label: `${progression.mantra || "만트라"} 석상`, pos: new BABYLON.Vector3(0, 1, 0.8), color: new BABYLON.Color3(1, 1, 1) },
      { id: "gate", label: "다음 층 게이트", pos: new BABYLON.Vector3(0, 1, -5), color: new BABYLON.Color3(1, 0.5, 0.5) },
    ];
    defs.forEach((d) => {
      const m = BABYLON.MeshBuilder.CreateCylinder(`iw_${d.id}`, { height: 1.8, diameter: 0.9 }, scene);
      m.position.copyFrom(d.pos);
      const mat = new BABYLON.StandardMaterial(`iwm_${d.id}`, scene);
      mat.emissiveColor = d.color;
      m.material = mat;
      innerInteractables.push({ ...d, mesh: m });
    });
  }
  function openInnerPanel(id) {
    activeInnerPanel = id;
    progression.innerWorld.step = id === "reward" ? "reward"
      : id === "storage" ? "skill"
      : id === "shop" ? "shop"
      : id === "statue" ? (getPendingSkillSlot(progression) ? "skillCreate" : "stats")
      : id === "gate" ? "next"
      : "none";
    if (id === "training") {
      ui.learnResult.textContent = "연습실: 기본 공격/마법/스킬 테스트 가능 (진행 영향 없음)";
      progression.innerWorld.step = "spellBook";
    }
    renderInnerWorld();
  }
  function tryInteractWithInnerWorldObject() {
    const hit = innerInteractables.find((obj) => BABYLON.Vector3.Distance(player.position, obj.mesh.position) <= 2.1);
    if (!hit) return false;
    openInnerPanel(hit.id);
    return true;
  }

  function enterInnerWorld() {
    if (progression.innerWorld.rewardGranted) return;
    progression.innerWorld.rewardGranted = true;
    progression.innerWorld.active = true;
    progression.innerWorld.step = "recovery";
    progression.innerWorld.rewardChosen = false;
    progression.innerWorld.statsDone = false;
    progression.innerWorld.skillCreatedDone = false;
    battle.recoverFull();

    progression.level += 5;
    progression.statPoints += 15;
    progression.coins += 1;
    progression.rewardDrawTicketCount += 1;
    progression.currentRewards = [];
    battle.despawnEnemy();

    input.setEnabled(true);
    applyGameplayVisibility(true);
    ui.inner.classList.remove("hidden");
    gameMode = MAP_STATE.INNER_WORLD;
    gameState = GAME_STATE.INNER_WORLD;
    mapManager.showInnerWorldMap({ floor: progression.floor, level: progression.level });
    camera.radius = 16;
    camera.beta = Math.PI / 2.8;

    progression.innerWorld.step = "none";
    spawnInnerWorldInteractables();
    renderInnerWorld();
    ui.innerStepText.textContent = "층 클리어: 레벨 +5 / 스탯 +15 / 코인 +1 / 보상 뽑기권 +1";
    autosave("enter_inner_world");
  }

  function leaveInnerWorldToNextFloor() {
    clearInnerInteractables();
    progression.floor += 1;
    progression.innerWorld.active = false;
    progression.innerWorld.step = "none";
    progression.innerWorld.rewardGranted = false;
    ui.inner.classList.add("hidden");
    input.setEnabled(true);
    applyGameplayVisibility(true);
    battle.setupForFloor(progression.floor);
    const floorMap = mapManager.showFloorCombatMap(battle.getEnemyDescriptor(), { floor: progression.floor, level: progression.level });
    battle.setArenaRadius(floorMap.bounds?.arenaRadius || 8.2);
    gameMode = MAP_STATE.FLOOR_COMBAT;
    gameState = GAME_STATE.FLOOR_COMBAT;
    camera.radius = 11;
    camera.beta = Math.PI / 3.2;
    autosave("next_floor");
  }

  function renderStatPanel() {
    ui.statList.innerHTML = "";
    const labels = {
      strength: "힘",
      agility: "민첩",
      appearance: "외모(운)",
      vitality: "체력",
      intelligence: "지능",
      wisdom: "지혜",
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
        const cap = getStatCap(progression.level);
        if ((progression.growth.state.baseStats[key] || 0) >= cap) return;
        progression.growth.state.baseStats[key] += 1;
        progression.statPoints -= 1;
        progression.growth.recalculate(progression.swordStage, progression.level, progression.manualUseCounts, progression.multiCastingCount);
        battle.refreshDerivedStats();
        renderInnerWorld();
        autosave("stat_allocate");
      });
      wrap.appendChild(btn);
      ui.statList.appendChild(wrap);
    });
  }

  function renderRewardPanel() {
    ui.rewardChoices.innerHTML = "";
    if (!progression.currentRewards.length) {
      const info = document.createElement("div");
      info.textContent = `보상 뽑기권: ${progression.rewardDrawTicketCount}`;
      ui.rewardChoices.appendChild(info);
      ui.rerollBtn.textContent = "뽑기권 사용";
      ui.rerollBtn.disabled = progression.rewardDrawTicketCount <= 0;
      return;
    }

    progression.currentRewards.forEach((reward) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<div>${reward.name}</div><small>${reward.desc}</small>`;
      btn.disabled = progression.innerWorld.rewardChosen;
      btn.addEventListener("click", () => {
        selectReward(reward);
        progression.innerWorld.rewardChosen = true;
        progression.currentRewards = [];
        progression.innerWorld.step = "none";
        renderInnerWorld();
      });
      ui.rewardChoices.appendChild(btn);
    });
    ui.rerollBtn.textContent = "리롤(코인 1)";
    ui.rerollBtn.disabled = progression.coins <= 0 || progression.innerWorld.rewardChosen;
  }

  function selectReward(reward) {
    if (reward.type === "martialManual") {
      if (reward.payload.manualType === "external") progression.inventory.externalManualCount += 1;
      if (reward.payload.manualType === "internal") progression.inventory.internalManualCount += 1;
      if (reward.payload.manualType === "sword") progression.inventory.swordEnergyCount += 1;
    } else if (reward.type === "spellBook") {
      progression.inventory.spellBooks.push({ grade: reward.payload.grade, used: false });
    } else if (reward.type === "skillResetTicket") {
      progression.inventory.skillResetTicketCount += 1;
    } else if (reward.type === "coin") {
      progression.coins += reward.payload.amount;
    }
    progression.growth.recalculate(progression.swordStage, progression.level, progression.manualUseCounts, progression.multiCastingCount);
    battle.refreshDerivedStats();
    autosave("reward_select");
  }

  function renderInnerWorld() {
    const pendingSkillSlot = getPendingSkillSlot(progression);
    const step = progression.innerWorld.step;
    ui.innerStepText.textContent =
      step === "reward"
        ? `보상 뽑기 장치 (티켓 ${progression.rewardDrawTicketCount})`
        : step === "stats"
          ? "순서 2/6: 스탯 투자"
          : step === "skillCreate"
            ? "순서 3/6: 스킬 생성"
            : step === "skill"
              ? "순서 4/6: 무공서/마법서/상점 행동"
              : step === "spellBook"
                ? "순서 4/6: 무공서/마법서/상점 행동"
                : step === "shop"
                  ? "순서 5/6: 상점"
          : step === "next"
            ? "순서 6/6: 다음 층 진입"
            : "심상세계 탐색: 오브젝트 근처에서 기본 공격으로 상호작용";

    ui.rewardPanel.classList.toggle("hidden", step !== "reward");
    ui.statPanel.classList.toggle("hidden", step !== "stats");
    ui.skillCreatePanel.classList.toggle("hidden", step !== "skillCreate");
    ui.manualPanel.classList.toggle("hidden", step !== "skill");
    ui.spellBookPanel.classList.toggle("hidden", step !== "spellBook");
    ui.shopPanel.classList.toggle("hidden", step !== "shop");
    ui.nextFloorBtn.classList.toggle("hidden", step !== "next");

    if (step === "reward") renderRewardPanel();
    if (step === "stats") renderStatPanel();
    if (step === "skillCreate") {
      ui.pendingSkillText.textContent = pendingSkillSlot
        ? `현재 생성 대상: ${getPendingSkillLabel(progression)}`
        : "생성할 스킬 없음";
      ui.createSkillBtn.disabled = !pendingSkillSlot;
    }
    if (step === "skill") {
      ui.manualCounts.textContent = `외공서 ${progression.inventory.externalManualCount} / 내공서 ${progression.inventory.internalManualCount} / 검기 ${progression.inventory.swordEnergyCount}`;
    }
    if (step === "spellBook") {
      ui.spellBookList.textContent = progression.inventory.spellBooks.length
        ? progression.inventory.spellBooks.map((b, i) => `${i + 1}. ${b.grade}${b.used ? "(사용됨)" : ""}`).join(" | ")
        : "없음";
      ui.learnedMagicList.textContent = progression.inventory.magicList.length
        ? `습득 마법: ${progression.inventory.magicList.map((m) => m.name).join(", ")}`
        : "습득 마법 없음";
    }
    if (step === "next") {
      ui.nextFloorBtn.disabled = !!pendingSkillSlot;
    }
  }

  function refreshMagicSelect() {
    magicSelect.innerHTML = "";
    progression.inventory.magicList.forEach((spell) => {
      const op = document.createElement("option");
      op.value = spell.id;
      op.textContent = `${spell.name} (${spell.circle}서클)`;
      magicSelect.appendChild(op);
    });
    if (!progression.equippedMagicId && progression.inventory.magicList[0]) {
      progression.equippedMagicId = progression.inventory.magicList[0].id;
    }
    if (progression.equippedMagicId) {
      magicSelect.value = progression.equippedMagicId;
    }
  }

  CHARACTER_CREATION_STAT_KEYS.forEach((key) => {
    const row = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = `${CHARACTER_CREATION_STAT_LABELS[key]} `;
    const inputEl = document.createElement("input");
    inputEl.type = "number";
    inputEl.min = "0";
    inputEl.step = "1";
    inputEl.value = "0";
    inputEl.addEventListener("input", () => {
      const n = Number(inputEl.value);
      characterForm.statAllocation[key] = Number.isInteger(n) && n >= 0 ? n : 0;
      renderCharacterCreation();
    });
    row.appendChild(label);
    row.appendChild(inputEl);
    ui.ccStatInputs.appendChild(row);
  });

  MANTRA_PRESETS.forEach((name) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = name;
    b.addEventListener("click", () => {
      ui.mantraNameInput.value = name;
      characterForm.mantra.name = name;
    });
    ui.mantraPresetButtons.appendChild(b);
  });
  ORIGINAL_MANA_PRESETS.forEach((name) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = name;
    b.addEventListener("click", () => {
      ui.manaNameInput.value = name;
      characterForm.originalMana.name = name;
    });
    ui.manaPresetButtons.appendChild(b);
  });

  ui.startGameBtn.addEventListener("click", () => startNewGame());
  ui.continueGameBtn.addEventListener("click", () => {
    const loaded = loadCharacter();
    if (!loaded) return;
    if (!loaded.ok) {
      window.alert("저장 데이터 버전이 맞지 않거나 손상되었습니다. 새 게임을 시작해주세요.");
      return;
    }
    if (!restoreFromSaveRecord(loaded)) {
      ui.titleScreen.classList.remove("hidden");
    }
  });
  ui.continueGameBtn.disabled = !hasSavedCharacter();
  ui.debugSaveBtn.addEventListener("click", () => autosave("debug_save"));
  ui.debugLoadBtn.addEventListener("click", () => {
    const loaded = loadCharacter();
    if (loaded && loaded.ok) restoreFromSaveRecord(loaded);
  });
  ui.debugClearBtn.addEventListener("click", () => {
    clearSave();
    ui.continueGameBtn.disabled = true;
  });
  ui.debugCoinBtn.addEventListener("click", () => {
    progression.coins += 10;
    autosave("debug_coin");
  });
  ui.debugLevelBtn.addEventListener("click", () => {
    progression.level += 5;
    progression.growth.recalculate(progression.swordStage, progression.level, progression.manualUseCounts, progression.multiCastingCount);
    battle.refreshDerivedStats();
    autosave("debug_level");
  });
  ui.debugInnerBtn.addEventListener("click", () => {
    if (gameMode === MAP_STATE.FLOOR_COMBAT) {
      progression.currentEnemyData = battle.getEnemyDescriptor();
      enterInnerWorld();
    }
  });
  ui.debugNextFloorBtn.addEventListener("click", () => {
    if (gameMode === MAP_STATE.INNER_WORLD) {
      progression.innerWorld.step = "next";
      leaveInnerWorldToNextFloor();
    } else if (gameMode === MAP_STATE.FLOOR_COMBAT) {
      progression.floor += 1;
      battle.setupForFloor(progression.floor);
      autosave("debug_next_floor");
    }
  });

  ui.ccBackBtn.addEventListener("click", () => {
    if (characterForm.stepIndex <= 0) return;
    characterForm.stepIndex -= 1;
    ui.ccError.textContent = "";
    if (CHARACTER_CREATION_STEPS[characterForm.stepIndex] === "confirm") {
      gameState = GAME_STATE.CHARACTER_CONFIRM;
    } else {
      gameState = GAME_STATE.CHARACTER_CREATION;
    }
    renderCharacterCreation();
  });

  ui.ccNextBtn.addEventListener("click", () => {
    const step = CHARACTER_CREATION_STEPS[characterForm.stepIndex];
    ui.ccError.textContent = "";
    if (step === "name") {
      characterForm.profile.name = ui.charNameInput.value.trim();
      characterForm.profile.gender = ui.charGenderInput.value.trim();
      if (!validateCharacterName(characterForm)) {
        ui.ccError.textContent = "이름을 입력해야 합니다.";
        return;
      }
    } else if (step === "stats") {
      if (!validateStatAllocation(characterForm)) {
        ui.ccError.textContent = "능력치 합계가 정확히 54여야 합니다.";
        return;
      }
    } else if (step === "mantra") {
      characterForm.mantra.name = ui.mantraNameInput.value.trim();
      characterForm.mantra.category = ui.mantraCategoryInput.value.trim();
      characterForm.mantra.description = ui.mantraDescInput.value.trim();
      if (!characterForm.mantra.name) {
        ui.ccError.textContent = "만트라를 입력 또는 선택하세요.";
        return;
      }
    } else if (step === "originalMana") {
      characterForm.originalMana.name = ui.manaNameInput.value.trim();
      characterForm.originalMana.type = ui.manaTypeInput.value.trim();
      characterForm.originalMana.description = ui.manaDescInput.value.trim();
      if (!characterForm.originalMana.name) {
        ui.ccError.textContent = "오리지널 마나를 입력 또는 선택하세요.";
        return;
      }
    } else if (step === "lore") {
      characterForm.profile.worldDestructionCause = ui.worldCauseInput.value.trim();
      characterForm.profile.destroyer = ui.destroyerInput.value.trim();
      characterForm.profile.finalMoment = ui.finalMomentInput.value.trim();
      characterForm.profile.goal = ui.goalInput.value.trim();
      if (!characterForm.profile.worldDestructionCause || !characterForm.profile.destroyer || !characterForm.profile.finalMoment || !characterForm.profile.goal) {
        ui.ccError.textContent = "세계관 입력 항목을 모두 채워야 합니다.";
        return;
      }
    }
    characterForm.stepIndex = Math.min(characterForm.stepIndex + 1, CHARACTER_CREATION_STEPS.length - 1);
    if (CHARACTER_CREATION_STEPS[characterForm.stepIndex] === "confirm") {
      gameState = GAME_STATE.CHARACTER_CONFIRM;
    }
    renderCharacterCreation();
  });

  ui.ccEditBtn.addEventListener("click", () => {
    characterForm.stepIndex = 0;
    gameState = GAME_STATE.CHARACTER_CREATION;
    renderCharacterCreation();
  });

  ui.enterFloorBtn.addEventListener("click", () => {
    const result = confirmCharacter(characterForm);
    if (!result.ok) {
      ui.ccError.textContent = "캐릭터 생성 항목이 누락되었습니다.";
      return;
    }
    const created = createPlayerFromCharacterForm(characterForm);
    applyCreatedCharacterToProgression(created);
    autosave("character_creation_complete");
    enterFirstFloor();
  });

  ui.rerollBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "reward") return;
    if (!progression.currentRewards.length) {
      if (progression.rewardDrawTicketCount <= 0) return;
      progression.rewardDrawTicketCount -= 1;
      progression.innerWorld.rewardChosen = false;
      progression.currentRewards = generateRewardChoices(progression.currentEnemyData);
      renderInnerWorld();
      autosave("reward_draw_ticket_use");
      return;
    }
    if (progression.coins <= 0) return;
    progression.coins -= 1;
    progression.currentRewards = rerollRewards(progression.currentEnemyData);
    renderInnerWorld();
    autosave("reward_reroll");
  });

  ui.statDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "stats") return;
    progression.innerWorld.statsDone = true;
    progression.innerWorld.step = getPendingSkillSlot(progression) ? "skillCreate" : "skill";
    renderInnerWorld();
    autosave("stat_phase_done");
  });

  ui.autoSkillNameBtn.addEventListener("click", () => {
    const slotId = getPendingSkillSlot(progression);
    if (!slotId) return;
    const meta = getSkillSlotMeta(slotId);
    ui.skillNameInput.value = `${meta?.label || slotId} ${ui.skillTypeSelect.value || "skill"}`;
  });

  ui.createSkillBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "skillCreate") return;
    const slotId = getPendingSkillSlot(progression);
    if (!slotId) return;
    const result = createSkill(slotId, {
      name: ui.skillNameInput.value,
      type: ui.skillTypeSelect.value,
      attribute: ui.skillAttributeSelect.value,
      description: ui.skillDescInput.value,
    });
    ui.skillCreateResult.textContent = result.ok ? `${result.skill.name} 생성 완료` : `실패: ${result.reason}`;
    if (result.ok) {
      ui.skillNameInput.value = "";
      ui.skillDescInput.value = "";
      if (!getPendingSkillSlot(progression)) {
        progression.innerWorld.step = "skill";
      }
    }
    renderInnerWorld();
    if (result.ok) autosave("skill_create");
  });

  ui.useExternalBtn.addEventListener("click", () => {
    const ok = useMartialManual(progression, progression.inventory, "external");
    battle.refreshDerivedStats();
    renderInnerWorld();
    if (ok) autosave("manual_external_use");
  });
  ui.useInternalBtn.addEventListener("click", () => {
    const ok = useMartialManual(progression, progression.inventory, "internal");
    battle.refreshDerivedStats();
    renderInnerWorld();
    if (ok) autosave("manual_internal_use");
  });
  ui.useSwordBtn.addEventListener("click", () => {
    const ok = useMartialManual(progression, progression.inventory, "sword");
    battle.refreshDerivedStats();
    renderInnerWorld();
    if (ok) autosave("manual_sword_use");
  });

  ui.manualDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "skill") return;
    progression.innerWorld.step = "spellBook";
    renderInnerWorld();
  });

  ui.learnSpellBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "spellBook") return;
    const result = attemptLearnSpellBook(progression, progression.inventory, false);
    ui.learnResult.textContent = result.ok ? `성공: ${result.spellName || "효과 적용"}` : "실패";
    refreshMagicSelect();
    renderInnerWorld();
    autosave("spellbook_use");
  });

  ui.extraLearnBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "spellBook") return;
    if (progression.coins <= 0) return;
    progression.coins -= 1;
    const result = attemptLearnSpellBook(progression, progression.inventory, true);
    ui.learnResult.textContent = result.ok ? `성공: ${result.spellName || "효과 적용"}` : "실패";
    refreshMagicSelect();
    renderInnerWorld();
    autosave("spellbook_extra_use");
  });

  ui.spellBookDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "spellBook") return;
    progression.innerWorld.step = "shop";
    renderInnerWorld();
  });

  function shopCtx() {
    return { canTrade: progression.innerWorld.step === "shop", progression, inventory: progression.inventory };
  }
  ui.buyExternalBtn.addEventListener("click", () => { if (buyShopItem(shopCtx(), "buy_external")) autosave("shop_buy_external"); renderInnerWorld(); });
  ui.buyInternalBtn.addEventListener("click", () => { if (buyShopItem(shopCtx(), "buy_internal")) autosave("shop_buy_internal"); renderInnerWorld(); });
  ui.buySwordBtn.addEventListener("click", () => { if (buyShopItem(shopCtx(), "buy_sword")) autosave("shop_buy_sword"); renderInnerWorld(); });
  ui.buyTicketBtn.addEventListener("click", () => { if (buyShopItem(shopCtx(), "buy_ticket")) autosave("shop_buy_ticket"); renderInnerWorld(); });
  ui.buySkillResetBtn.addEventListener("click", () => { if (buyShopItem(shopCtx(), "buy_skill_reset")) autosave("shop_buy_reset"); renderInnerWorld(); });
  ui.sellExternalBtn.addEventListener("click", () => { if (sellShopItem(shopCtx(), "sell_external")) autosave("shop_sell_external"); renderInnerWorld(); });
  ui.sellInternalBtn.addEventListener("click", () => { if (sellShopItem(shopCtx(), "sell_internal")) autosave("shop_sell_internal"); renderInnerWorld(); });
  ui.sellSwordBtn.addEventListener("click", () => { if (sellShopItem(shopCtx(), "sell_sword")) autosave("shop_sell_sword"); renderInnerWorld(); });
  ui.drawTicketBtn.addEventListener("click", () => {
    const result = drawMartialManualTicket(shopCtx());
    if (!result) return;
    if (result.manualType === "external") progression.inventory.externalManualCount += 1;
    if (result.manualType === "internal") progression.inventory.internalManualCount += 1;
    if (result.manualType === "sword") progression.inventory.swordEnergyCount += 1;
    renderInnerWorld();
    autosave("manual_ticket_draw");
  });
  ui.shopDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "shop") return;
    progression.innerWorld.step = "next";
    renderInnerWorld();
  });

  ui.nextFloorBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "next") return;
    if (getPendingSkillSlot(progression)) return;
    leaveInnerWorldToNextFloor();
  });

  magicSelect.addEventListener("change", () => {
    progression.equippedMagicId = magicSelect.value || null;
  });
  refreshMagicSelect();
  applyGameplayVisibility(false);
  input.setEnabled(false);
  ui.inner.classList.add("hidden");
  ui.characterCreation.classList.add("hidden");
  ui.titleScreen.classList.remove("hidden");


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
    if (gameMode === MAP_STATE.INNER_WORLD && actions.attackPressed) {
      tryInteractWithInnerWorldObject();
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
    const equippedSpell = progression.inventory.magicList.find((s) => s.id === progression.equippedMagicId);
    hud.spellInfo.textContent = `마법: ${equippedSpell ? equippedSpell.name : "-"}`;
    hud.magicCooldownInfo.textContent = `마법 쿨타임: ${Math.max(0, pState.magicCooldown || 0).toFixed(1)}s`;
    const selectedSkill = progression.skills.selectedSlotId ? progression.skills.slots[progression.skills.selectedSlotId] : null;
    const nowSec = performance.now() / 1000;
    const remain = selectedSkill ? Math.max(0, (progression.skills.cooldowns[selectedSkill.slotId] || 0) - nowSec) : 0;
    hud.skillInfo.textContent = `스킬: ${selectedSkill ? `${selectedSkill.name} (${selectedSkill.slotId})` : "-"}`;
    hud.skillCooldownInfo.textContent = `스킬 쿨타임: ${remain.toFixed(1)}s`;
    hud.manualInfo.textContent = `외공서 ${progression.inventory.externalManualCount} | 내공서 ${progression.inventory.internalManualCount} | 검기 ${progression.inventory.swordEnergyCount}`;
    const swordData = SWORD_STAGE_DATA[progression.swordStage] || SWORD_STAGE_DATA[0];
    hud.swordStageInfo.textContent = `검기 단계: ${swordData.name} (${progression.swordStage})`;
    hud.actionFeedback.textContent = pState.feedback;
    input.setActionButtonsState({ ...battle.getCooldownState(), locked: battle.isLockOnActive() });

    if (gameMode === MAP_STATE.FLOOR_COMBAT && battle.getPhase() === "clear") {
      hud.battleMessage.textContent = "층 클리어";
      if (!progression.innerWorld.active) {
        autosave("floor_clear");
        progression.currentEnemyData = battle.getEnemyDescriptor();
        enterInnerWorld();
      }
    } else if (gameMode === MAP_STATE.FLOOR_COMBAT && battle.getPhase() === "defeat") {
      hud.battleMessage.textContent = "패배";
      input.setEnabled(false);
      gameState = GAME_STATE.GAME_OVER;
      autosave("player_dead");
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
