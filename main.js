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

const REWARD_POOL = [
  { id: "maxHp", label: "최대 HP +20", apply: (s) => (s.bonus.maxHp += 20) },
  { id: "attack", label: "공격력 +4", apply: (s) => (s.bonus.attack += 4) },
  { id: "dodge", label: "회피 거리 +0.8", apply: (s) => (s.bonus.dodgeDistance += 0.8) },
  { id: "guard", label: "가드 강화(+정면 판정)", apply: (s) => (s.bonus.guardAngle += 0.08) },
  { id: "move", label: "이동속도 +0.5", apply: (s) => (s.bonus.moveSpeed += 0.5) },
  { id: "crit", label: "치명타 확률 +5%", apply: (s) => (s.bonus.critChance += 0.05) },
];

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function sampleRewards() {
  const shuffled = [...REWARD_POOL].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function createProgressionState() {
  return {
    floor: 1,
    level: 1,
    statPoints: 0,
    coins: 0,
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
    stats: { ...BASE_STATS },
    bonus: {
      maxHp: 0,
      attack: 0,
      dodgeDistance: 0,
      guardAngle: 0,
      moveSpeed: 0,
      critChance: 0,
    },
    currentRewards: [],
    innerWorld: {
      active: false,
      step: "none", // recovery -> reward -> stats -> next
      rewardChosen: false,
      statsDone: false,
    },
  };
}

function createInputController(scene) {
  const keys = { w: false, a: false, s: false, d: false };
  const action = { attackPressed: false, dodgePressed: false, guardHeld: false, magicPressed: false };
  let enabled = true;

  const joystickRoot = document.getElementById("mobileJoystick");
  const joystickBase = document.getElementById("joystickBase");
  const joystickKnob = document.getElementById("joystickKnob");
  const attackBtn = document.getElementById("attackBtn");
  const dodgeBtn = document.getElementById("dodgeBtn");
  const guardBtn = document.getElementById("guardBtn");
  const magicBtn = document.getElementById("magicBtn");

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
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    moveSpeed: 4.5,
    attackDamage: 20,
    critChance: 0.05,
    dodgeSpeed: 11,
    dodgeDuration: 0.22,
    dodgeDistance: 2.6,
    dodgeTimer: 0,
    dodging: false,
    invincible: false,
    guardHeld: false,
    attackTimer: 0,
    attackCooldown: 0,
    attackHitDone: false,
    feedback: "",
    feedbackTimer: 0,
  };

  let enemy = null;
  let enemyFront = null;
  let enemyMat = null;
  let enemyDescriptor = { type: "default", mapId: "defaultCylinderRoom" };
  const enemyState = {
    hp: 100,
    maxHp: 100,
    moveSpeed: 2.6,
    attackDamage: 12,
    attackRange: 1.6,
    chaseRange: 10,
    attackTimer: 0,
    attackCooldown: 0,
    attackHitDone: false,
  };
  const projectileState = [];
  let arenaRadius = 8.2;

  const battle = { phase: "playing" };

  function recomputePlayerFromStats() {
    const s = progression.stats;
    const b = progression.bonus;
    playerState.maxHp = 100 + s.vitality * 8 + b.maxHp;
    playerState.maxMp = 100 + s.intelligence * 5;
    playerState.mpRegen = 0.8 + s.wisdom * 0.08;
    playerState.moveSpeed = 3.5 + s.agility * 0.08 + b.moveSpeed;
    playerState.attackDamage = 8 + s.strength * 1.6 + b.attack;
    playerState.critChance = clamp01(0.05 + s.luck * 0.004 + b.critChance);
    playerState.dodgeDistance = 2.2 + s.agility * 0.03 + b.dodgeDistance;
    playerState.dodgeSpeed = playerState.dodgeDistance / playerState.dodgeDuration;
    playerState.hp = Math.min(playerState.hp, playerState.maxHp);
    playerState.mp = Math.min(playerState.mp, playerState.maxMp);
  }

  function spawnEnemyForFloor(floor) {
    if (enemy) {
      enemy.dispose();
      enemyFront.dispose();
    }

    const mapRotation = ["defaultCylinderRoom", "beastArena", "mageChamber", "bossVoidRoom"];
    enemyDescriptor = {
      type: floor % 4 === 0 ? "boss" : floor % 2 === 0 ? "beast" : "soldier",
      mapId: mapRotation[(floor - 1) % mapRotation.length],
    };

    enemy = BABYLON.MeshBuilder.CreateCapsule("enemy", { height: 2, radius: 0.4 }, scene);
    enemy.position = new BABYLON.Vector3(0, 1, 5);
    enemy.rotationQuaternion = BABYLON.Quaternion.Identity();
    enemyMat = new BABYLON.StandardMaterial(`enemyMat${floor}`, scene);
    enemyMat.diffuseColor = new BABYLON.Color3(1, 0.65, 0.65);
    enemy.material = enemyMat;

    enemyFront = BABYLON.MeshBuilder.CreateCylinder(
      "enemyFront",
      { diameterTop: 0, diameterBottom: 0.24, height: 0.35, tessellation: 4 },
      scene
    );
    enemyFront.parent = enemy;
    enemyFront.position = new BABYLON.Vector3(0, 1.0, 0.55);
    enemyFront.rotation.x = Math.PI / 2;
    const frontMat = new BABYLON.StandardMaterial(`enemyFrontMat${floor}`, scene);
    frontMat.emissiveColor = new BABYLON.Color3(1, 0.25, 0.25);
    enemyFront.material = frontMat;

    const scale = 1 + (floor - 1) * 0.18;
    enemyState.maxHp = 90 * scale;
    enemyState.hp = enemyState.maxHp;
    enemyState.moveSpeed = 2.3 + floor * 0.12;
    enemyState.attackDamage = 10 + floor * 1.8;
    enemyState.attackRange = 1.6 + Math.min(0.5, floor * 0.02);
    enemyState.attackCooldown = 0;
    enemyState.attackTimer = 0;
    enemyState.attackHitDone = false;

    battle.phase = "playing";
  }

  function recoverFull() {
    playerState.hp = playerState.maxHp;
    playerState.mp = playerState.maxMp;
  }

  function dealDamageToEnemy(amount) {
    enemyState.hp = Math.max(0, enemyState.hp - amount);
    if (enemyState.hp <= 0) {
      battle.phase = "clear";
    }
  }

  function clampInsideArena(position) {
    const radius = arenaRadius - 0.35;
    const len = Math.hypot(position.x, position.z);
    if (len > radius && len > 0.0001) {
      const scale = radius / len;
      position.x *= scale;
      position.z *= scale;
    }
  }

  function getEquippedSpell() {
    return progression.spellSlots.known.find((s) => s.id === progression.spellSlots.equipped) || null;
  }

  function castMagic() {
    const spell = getEquippedSpell();
    if (!spell || !enemy) return;
    if (playerState.mp < spell.mpCost) {
      playerState.feedback = "MP 부족";
      playerState.feedbackTimer = 0.2;
      return;
    }

    playerState.mp -= spell.mpCost;
    playerState.feedback = "마법";
    playerState.feedbackTimer = 0.2;

    const forward = getFacing(player);
    const bullet = BABYLON.MeshBuilder.CreateSphere(`magic_${Date.now()}`, { diameter: spell.radius * 2 }, scene);
    bullet.position = player.position.add(forward.scale(0.9)).add(new BABYLON.Vector3(0, 0.6, 0));
    const mat = new BABYLON.StandardMaterial(`magicMat_${Date.now()}`, scene);
    mat.emissiveColor = new BABYLON.Color3(1, 0.45, 0.18);
    bullet.material = mat;

    projectileState.push({
      mesh: bullet,
      dir: forward,
      speed: spell.speed,
      remain: spell.range,
      damage: playerState.attackDamage * spell.damageScale,
    });
  }

  function dealDamageToPlayer(amount) {
    if (playerState.invincible) return;

    let final = amount;
    if (playerState.guardHeld) {
      const forward = getFacing(player);
      const toEnemy = enemy.position.subtract(player.position);
      toEnemy.y = 0;
      if (toEnemy.lengthSquared() > 0) {
        toEnemy.normalize();
        const guardDot = 0.12 + progression.bonus.guardAngle;
        if (BABYLON.Vector3.Dot(forward, toEnemy) >= guardDot) {
          final = 0;
          playerState.feedback = "가드 성공";
          playerState.feedbackTimer = 0.2;
        }
      }
    }

    playerState.hp = Math.max(0, playerState.hp - final);
    if (playerState.hp <= 0) battle.phase = "defeat";
  }

  return {
    setupForFloor(floor) {
      recomputePlayerFromStats();
      spawnEnemyForFloor(floor);
      player.position.set(0, 1, 0);
      player.rotationQuaternion = BABYLON.Quaternion.Identity();
      playerState.hp = Math.min(playerState.hp, playerState.maxHp);
      playerState.mp = Math.min(playerState.mp, playerState.maxMp);
    },
    recoverFull,
    setArenaRadius(radius) {
      arenaRadius = radius;
      clampInsideArena(player.position);
      if (enemy) clampInsideArena(enemy.position);
    },
    clampAllInsideArena() {
      clampInsideArena(player.position);
      if (enemy) clampInsideArena(enemy.position);
    },
    update(delta, moveDir, actions) {
      if (battle.phase !== "playing") return;

      playerState.attackCooldown = Math.max(0, playerState.attackCooldown - delta);
      enemyState.attackCooldown = Math.max(0, enemyState.attackCooldown - delta);
      playerState.guardHeld = !!actions.guardHeld && !playerState.dodging;
      playerState.mp = Math.min(playerState.maxMp, playerState.mp + playerState.mpRegen * delta);

      if (actions.attackPressed && playerState.attackCooldown <= 0 && !playerState.dodging) {
        playerState.attackTimer = 0.16;
        playerState.attackCooldown = 0.3;
        playerState.attackHitDone = false;
        playerState.feedback = "공격";
        playerState.feedbackTimer = 0.15;
      }

      if (actions.dodgePressed && !playerState.dodging) {
        playerState.dodging = true;
        playerState.dodgeTimer = playerState.dodgeDuration;
        playerState.invincible = true;
        playerState.feedback = "회피";
        playerState.feedbackTimer = 0.16;
      }
      if (actions.magicPressed) {
        castMagic();
      }

      if (playerState.attackTimer > 0) {
        playerState.attackTimer -= delta;
        if (!playerState.attackHitDone) {
          const toEnemy = enemy.position.subtract(player.position);
          toEnemy.y = 0;
          const dist = toEnemy.length();
          if (dist <= 1.85) {
            toEnemy.normalize();
            if (BABYLON.Vector3.Dot(getFacing(player), toEnemy) > 0.2) {
              const crit = Math.random() < playerState.critChance ? 1.5 : 1;
              dealDamageToEnemy(playerState.attackDamage * crit);
              playerState.attackHitDone = true;
              if (crit > 1) {
                playerState.feedback = "치명타!";
                playerState.feedbackTimer = 0.22;
              }
            }
          }
        }
      }

      if (playerState.dodging) {
        const dodgeDir = moveDir.lengthSquared() > 0 ? moveDir : getFacing(player);
        player.position.addInPlace(dodgeDir.scale(playerState.dodgeSpeed * delta));
        clampInsideArena(player.position);
        playerState.dodgeTimer -= delta;
        if (playerState.dodgeTimer < 0.12) playerState.invincible = false;
        if (playerState.dodgeTimer <= 0) {
          playerState.dodging = false;
          playerState.invincible = false;
        }
      }

      const toPlayer = player.position.subtract(enemy.position);
      toPlayer.y = 0;
      const distToPlayer = toPlayer.length();

      if (distToPlayer > 0.001) {
        const dir = toPlayer.normalize();
        const yaw = Math.atan2(dir.x, dir.z);
        const targetRot = BABYLON.Quaternion.FromEulerAngles(0, yaw, 0);
        enemy.rotationQuaternion = BABYLON.Quaternion.Slerp(enemy.rotationQuaternion, targetRot, Math.min(1, delta * 8));
      }

      if (distToPlayer > enemyState.attackRange && distToPlayer < enemyState.chaseRange) {
        enemy.position.addInPlace(toPlayer.normalize().scale(enemyState.moveSpeed * delta));
        clampInsideArena(enemy.position);
      } else if (enemyState.attackCooldown <= 0 && distToPlayer <= enemyState.attackRange) {
        enemyState.attackTimer = 0.22;
        enemyState.attackCooldown = 1.2;
        enemyState.attackHitDone = false;
      }

      if (enemyState.attackTimer > 0) {
        enemyState.attackTimer -= delta;
        if (!enemyState.attackHitDone && distToPlayer <= enemyState.attackRange + 0.1) {
          enemyState.attackHitDone = true;
          dealDamageToPlayer(enemyState.attackDamage);
        }
      }

      for (let i = projectileState.length - 1; i >= 0; i--) {
        const p = projectileState[i];
        const step = p.speed * delta;
        p.mesh.position.addInPlace(p.dir.scale(step));
        p.remain -= step;
        if (enemy) {
          const dist = BABYLON.Vector3.Distance(p.mesh.position, enemy.position.add(new BABYLON.Vector3(0, 0.7, 0)));
          if (dist <= 0.8) {
            dealDamageToEnemy(p.damage);
            p.remain = 0;
          }
        }
        if (p.remain <= 0) {
          p.mesh.dispose();
          projectileState.splice(i, 1);
        }
      }

      playerState.feedbackTimer = Math.max(0, playerState.feedbackTimer - delta);
      if (playerState.feedbackTimer <= 0) playerState.feedback = "";
    },
    getPlayerState() {
      return { ...playerState };
    },
    getEnemyState() {
      return { ...enemyState, mesh: enemy };
    },
    getEnemyDescriptor() {
      return { ...enemyDescriptor };
    },
    despawnEnemy() {
      if (enemy) enemy.dispose();
      if (enemyFront) enemyFront.dispose();
      enemy = null;
      enemyFront = null;
      enemyMat = null;
      projectileState.forEach((p) => p.mesh.dispose());
      projectileState.length = 0;
    },
    getPhase() {
      return battle.phase;
    },
    setPlayerEmissive(playerMat) {
      if (playerState.dodging) playerMat.emissiveColor = new BABYLON.Color3(0.2, 0.9, 1);
      else if (playerState.guardHeld) playerMat.emissiveColor = new BABYLON.Color3(0.2, 0.45, 1);
      else if (playerState.attackTimer > 0) playerMat.emissiveColor = new BABYLON.Color3(1, 0.45, 0.2);
      else playerMat.emissiveColor = BABYLON.Color3.Black();

      if (enemyMat) {
        enemyMat.emissiveColor = enemyState.attackTimer > 0 ? new BABYLON.Color3(1, 0.2, 0.2) : BABYLON.Color3.Black();
      }
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
  };

  function enterInnerWorld() {
    progression.innerWorld.active = true;
    progression.innerWorld.step = "recovery";
    progression.innerWorld.rewardChosen = false;
    progression.innerWorld.statsDone = false;
    battle.recoverFull();

    progression.level += 5;
    progression.statPoints += 15;
    progression.coins += 1;
    progression.currentRewards = sampleRewards();
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
      wrap.textContent = `${labels[key]}: ${progression.stats[key]}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "+1";
      btn.disabled = progression.statPoints <= 0;
      btn.addEventListener("click", () => {
        if (progression.statPoints <= 0) return;
        progression.stats[key] += 1;
        progression.statPoints -= 1;
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
      btn.textContent = reward.label;
      btn.disabled = progression.innerWorld.rewardChosen;
      btn.addEventListener("click", () => {
        reward.apply(progression);
        progression.innerWorld.rewardChosen = true;
        progression.innerWorld.step = "stats";
        renderInnerWorld();
      });
      ui.rewardChoices.appendChild(btn);
    });
    ui.rerollBtn.disabled = progression.coins <= 0 || progression.innerWorld.rewardChosen;
  }

  function renderInnerWorld() {
    const step = progression.innerWorld.step;
    ui.innerStepText.textContent =
      step === "reward"
        ? "순서 1/3: 보상 선택"
        : step === "stats"
          ? "순서 2/3: 스탯 투자"
          : step === "next"
            ? "순서 3/3: 다음 층 진입"
            : "회복";

    ui.rewardPanel.classList.toggle("hidden", step !== "reward");
    ui.statPanel.classList.toggle("hidden", step !== "stats");
    ui.nextFloorBtn.classList.toggle("hidden", step !== "next");

    if (step === "reward") renderRewardPanel();
    if (step === "stats") renderStatPanel();
  }

  ui.rerollBtn.addEventListener("click", () => {
    if (progression.coins <= 0 || progression.innerWorld.step !== "reward") return;
    progression.coins -= 1;
    progression.currentRewards = sampleRewards();
    renderInnerWorld();
  });

  ui.statDoneBtn.addEventListener("click", () => {
    if (progression.innerWorld.step !== "stats") return;
    progression.innerWorld.statsDone = true;
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
    const camForward = camera.getForwardRay().direction;
    camForward.y = 0;
    if (camForward.lengthSquared() > 0) camForward.normalize();
    const camRight = BABYLON.Vector3.Cross(BABYLON.Axis.Y, camForward).normalize();

    const moveDir = camRight.scale(moveInput.x).add(camForward.scale(moveInput.y));
    if (moveDir.lengthSquared() > 0) {
      moveDir.normalize();
      const yaw = Math.atan2(moveDir.x, moveDir.z);
      const target = BABYLON.Quaternion.FromEulerAngles(0, yaw, 0);
      player.rotationQuaternion = BABYLON.Quaternion.Slerp(player.rotationQuaternion, target, Math.min(1, dt * 10));
    }

    const actions = input.consumeActions();
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
    camera.setTarget(player.position);

    const eState = battle.getEnemyState();
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
    hud.actionFeedback.textContent = pState.feedback;

    if (gameMode === MAP_STATE.FLOOR_COMBAT && battle.getPhase() === "clear") {
      hud.battleMessage.textContent = "층 클리어";
      if (!progression.innerWorld.active) {
        enterInnerWorld();
      }
    } else if (gameMode === MAP_STATE.FLOOR_COMBAT && battle.getPhase() === "defeat") {
      hud.battleMessage.textContent = "패배";
      input.setEnabled(false);
    } else {
      hud.battleMessage.textContent = "";
    }
  });

  return scene;
}

const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
