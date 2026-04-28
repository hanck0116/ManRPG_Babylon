const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);

  const CONFIG = {
  player: {
    maxHp: 100,
    moveSpeed: 4.5,
    rotationSpeed: 10,
    attackRange: 1.8,
    attackAngleDotMin: 0.35,
    attackDamage: 25,
    attackDuration: 0.18,
    attackCooldown: 0.32,
    dodgeSpeed: 12,
    dodgeDuration: 0.22,
    dodgeInvincibleDuration: 0.16,
    dodgeCooldown: 0.45,
    guardDamageMultiplier: 0.35,
    guardFrontDotMin: 0.15,
  },
  enemy: {
    maxHp: 100,
    moveSpeed: 2.7,
    rotationSpeed: 8,
    chaseRange: 8,
    attackRange: 1.6,
    attackAngleDotMin: -1,
    attackDamage: 14,
    attackDuration: 0.26,
    attackCooldown: 1.2,
  },
};

function createInputController(scene) {
  const keys = { w: false, a: false, s: false, d: false };
  const actionState = {
    attackHeld: false,
    dodgeHeld: false,
    guardHeld: false,
    attackPressed: false,
    dodgePressed: false,
  };
  const movementSources = {
    keyboard: new BABYLON.Vector2(0, 0),
    joystick: new BABYLON.Vector2(0, 0),
  };

  const joystickRoot = document.getElementById("mobileJoystick");
  const joystickBase = document.getElementById("joystickBase");
  const joystickKnob = document.getElementById("joystickKnob");
  const attackBtn = document.getElementById("attackBtn");
  const dodgeBtn = document.getElementById("dodgeBtn");
  const guardBtn = document.getElementById("guardBtn");

  const joystickRadius = 60;
  const knobRadius = 27;
  const maxDistance = joystickRadius - knobRadius;
  let activeJoystickPointerId = null;

  const keyMap = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };

  function setButtonHold(button, isHeld) {
    button.classList.toggle("is-active", isHeld);
  }

  function bindTapButton(button, onPress, onRelease) {
    let pointerId = null;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointerId = event.pointerId;
      button.setPointerCapture(pointerId);
      onPress();
    });

    function stop(event) {
      if (pointerId !== event.pointerId) return;
      if (button.hasPointerCapture(pointerId)) {
        button.releasePointerCapture(pointerId);
      }
      pointerId = null;
      onRelease();
    }

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
  }

  function resetJoystick() {
    movementSources.joystick.set(0, 0);
    joystickKnob.style.left = "50%";
    joystickKnob.style.top = "50%";
  }

  function updateJoystickFromClient(clientX, clientY) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      deltaX *= ratio;
      deltaY *= ratio;
    }

    movementSources.joystick.set(deltaX / maxDistance, -deltaY / maxDistance);
    joystickKnob.style.left = `calc(50% + ${deltaX}px)`;
    joystickKnob.style.top = `calc(50% + ${deltaY}px)`;
  }

  joystickRoot.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activeJoystickPointerId = event.pointerId;
    joystickRoot.setPointerCapture(event.pointerId);
    updateJoystickFromClient(event.clientX, event.clientY);
  });

  joystickRoot.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activeJoystickPointerId) return;
    event.preventDefault();
    updateJoystickFromClient(event.clientX, event.clientY);
  });

  function stopJoystick(event) {
    if (event.pointerId !== activeJoystickPointerId) return;
    if (joystickRoot.hasPointerCapture(event.pointerId)) {
      joystickRoot.releasePointerCapture(event.pointerId);
    }
    activeJoystickPointerId = null;
    resetJoystick();
  }

  joystickRoot.addEventListener("pointerup", stopJoystick);
  joystickRoot.addEventListener("pointercancel", stopJoystick);
  resetJoystick();

  bindTapButton(
    attackBtn,
    () => {
      actionState.attackHeld = true;
      actionState.attackPressed = true;
      setButtonHold(attackBtn, true);
    },
    () => {
      actionState.attackHeld = false;
      setButtonHold(attackBtn, false);
    }
  );

  bindTapButton(
    dodgeBtn,
    () => {
      actionState.dodgeHeld = true;
      actionState.dodgePressed = true;
      setButtonHold(dodgeBtn, true);
    },
    () => {
      actionState.dodgeHeld = false;
      setButtonHold(dodgeBtn, false);
    }
  );

  bindTapButton(
    guardBtn,
    () => {
      actionState.guardHeld = true;
      setButtonHold(guardBtn, true);
    },
    () => {
      actionState.guardHeld = false;
      setButtonHold(guardBtn, false);
    }
  );

  scene.onKeyboardObservable.add((kbInfo) => {
    const code = kbInfo.event.code;
    const mapped = keyMap[code];
    const isDown = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
    const isUp = kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP;

    if (mapped) {
      if (isDown) keys[mapped] = true;
      if (isUp) keys[mapped] = false;
      return;
    }

    if (code === "Space" && isDown) {
      actionState.attackPressed = true;
      actionState.attackHeld = true;
    }
    if (code === "Space" && isUp) actionState.attackHeld = false;

    if ((code === "ShiftLeft" || code === "ShiftRight") && isDown) {
      actionState.dodgePressed = true;
      actionState.dodgeHeld = true;
    }
    if ((code === "ShiftLeft" || code === "ShiftRight") && isUp) actionState.dodgeHeld = false;

    if (code === "KeyF" && isDown) actionState.guardHeld = true;
    if (code === "KeyF" && isUp) actionState.guardHeld = false;
  });

  return {
    getMoveVector() {
      let x = 0;
      let z = 0;
      if (keys.w) z += 1;
      if (keys.s) z -= 1;
      if (keys.a) x -= 1;
      if (keys.d) x += 1;
      movementSources.keyboard.set(x, z);

      const move = movementSources.keyboard.add(movementSources.joystick);
      if (move.lengthSquared() > 1) move.normalize();
      return move;
    },
    getActionState() {
      return actionState;
    },
    consumeTriggers() {
      const triggered = {
        attack: actionState.attackPressed,
        dodge: actionState.dodgePressed,
      };
      actionState.attackPressed = false;
      actionState.dodgePressed = false;
      return triggered;
    },
  };
}

function forwardFromQuaternion(rotationQuaternion) {
  const rotMatrix = BABYLON.Matrix.Identity();
  rotationQuaternion.toRotationMatrix(rotMatrix);
  return BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, rotMatrix).normalize();
}

function createBattleSystem(player, enemy, input) {
  const playerState = {
    hp: CONFIG.player.maxHp,
    isDodging: false,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    dodgeDirection: new BABYLON.Vector3(0, 0, 1),
    isInvincible: false,
    isGuarding: false,
    attackTimer: 0,
    attackCooldown: 0,
    attackHitDone: false,
  };

  const enemyState = {
    hp: CONFIG.enemy.maxHp,
    attackTimer: 0,
    attackCooldown: 0,
    attackHitDone: false,
  };

  const gameState = {
    phase: "playing", // playing | clear | defeat
  };
  const fxState = {
    feedbackText: "",
    feedbackTimer: 0,
    playerAttackFxTimer: 0,
  };

  function triggerFeedback(text, duration = 0.25) {
    fxState.feedbackText = text;
    fxState.feedbackTimer = duration;
  }

  function getFacing(mesh) {
    if (!mesh.rotationQuaternion) mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
    return forwardFromQuaternion(mesh.rotationQuaternion);
  }

  function applyDamage(target, attacker, damage) {
    if (target === player && playerState.isInvincible) return;

    let finalDamage = damage;

    if (target === player && playerState.isGuarding) {
      const playerForward = getFacing(player);
      const toAttacker = attacker.position.subtract(player.position);
      toAttacker.y = 0;
      if (toAttacker.lengthSquared() > 0) {
        toAttacker.normalize();
        if (BABYLON.Vector3.Dot(playerForward, toAttacker) >= CONFIG.player.guardFrontDotMin) {
          finalDamage *= CONFIG.player.guardDamageMultiplier;
        }
      }
    }

    if (target === player) {
      playerState.hp = Math.max(0, playerState.hp - finalDamage);
      if (playerState.hp <= 0) gameState.phase = "defeat";
    } else {
      enemyState.hp = Math.max(0, enemyState.hp - finalDamage);
      if (enemyState.hp <= 0) gameState.phase = "clear";
    }
  }

  function tryPlayerAttackHit() {
    if (playerState.attackHitDone || enemyState.hp <= 0) return;

    const toEnemy = enemy.position.subtract(player.position);
    toEnemy.y = 0;
    const dist = toEnemy.length();
    if (dist > CONFIG.player.attackRange || dist <= 0) return;

    toEnemy.normalize();
    const forward = getFacing(player);
    const dot = BABYLON.Vector3.Dot(forward, toEnemy);
    if (dot < CONFIG.player.attackAngleDotMin) return;

    playerState.attackHitDone = true;
    applyDamage(enemy, player, CONFIG.player.attackDamage);
  }

  function tryEnemyAttackHit() {
    if (enemyState.attackHitDone || playerState.hp <= 0) return;

    const toPlayer = player.position.subtract(enemy.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist > CONFIG.enemy.attackRange || dist <= 0) return;

    toPlayer.normalize();
    const enemyForward = getFacing(enemy);
    const dot = BABYLON.Vector3.Dot(enemyForward, toPlayer);
    if (dot < CONFIG.enemy.attackAngleDotMin) return;

    enemyState.attackHitDone = true;
    applyDamage(player, enemy, CONFIG.enemy.attackDamage);
  }

  return {
    update(deltaSeconds, movementDirection) {
      if (gameState.phase !== "playing") return;

      const action = input.getActionState();
      const triggers = input.consumeTriggers();

      playerState.isGuarding = !!action.guardHeld && !playerState.isDodging;

      playerState.attackCooldown = Math.max(0, playerState.attackCooldown - deltaSeconds);
      playerState.dodgeCooldown = Math.max(0, playerState.dodgeCooldown - deltaSeconds);
      enemyState.attackCooldown = Math.max(0, enemyState.attackCooldown - deltaSeconds);

      if (triggers.attack && playerState.attackTimer <= 0 && playerState.attackCooldown <= 0 && !playerState.isDodging) {
        playerState.attackTimer = CONFIG.player.attackDuration;
        playerState.attackCooldown = CONFIG.player.attackCooldown;
        playerState.attackHitDone = false;
        fxState.playerAttackFxTimer = 0.14;
        triggerFeedback("공격!");
      }

      if (triggers.dodge && !playerState.isDodging && playerState.dodgeCooldown <= 0) {
        playerState.isDodging = true;
        playerState.dodgeTimer = CONFIG.player.dodgeDuration;
        playerState.dodgeCooldown = CONFIG.player.dodgeCooldown;
        playerState.isInvincible = true;

        if (movementDirection.lengthSquared() > 0) {
          playerState.dodgeDirection.copyFrom(movementDirection).normalize();
        } else {
          playerState.dodgeDirection.copyFrom(getFacing(player));
        }
        triggerFeedback("회피!");
      }

      if (playerState.isGuarding) {
        triggerFeedback("가드", 0.1);
      }

      if (playerState.attackTimer > 0) {
        playerState.attackTimer -= deltaSeconds;
        tryPlayerAttackHit();
      }

      if (playerState.isDodging) {
        player.position.addInPlace(playerState.dodgeDirection.scale(CONFIG.player.dodgeSpeed * deltaSeconds));
        playerState.dodgeTimer -= deltaSeconds;

        if (playerState.dodgeTimer <= CONFIG.player.dodgeDuration - CONFIG.player.dodgeInvincibleDuration) {
          playerState.isInvincible = false;
        }

        if (playerState.dodgeTimer <= 0) {
          playerState.isDodging = false;
          playerState.isInvincible = false;
        }
      }

      const toPlayer = player.position.subtract(enemy.position);
      toPlayer.y = 0;
      const distanceToPlayer = toPlayer.length();

      if (distanceToPlayer > 0.0001) {
        const dir = toPlayer.normalize();
        const targetYaw = Math.atan2(dir.x, dir.z);
        const targetRotation = BABYLON.Quaternion.FromEulerAngles(0, targetYaw, 0);
        if (!enemy.rotationQuaternion) enemy.rotationQuaternion = BABYLON.Quaternion.Identity();
        enemy.rotationQuaternion = BABYLON.Quaternion.Slerp(
          enemy.rotationQuaternion,
          targetRotation,
          Math.min(1, CONFIG.enemy.rotationSpeed * deltaSeconds)
        );
      }

      if (distanceToPlayer > CONFIG.enemy.attackRange && distanceToPlayer < CONFIG.enemy.chaseRange) {
        const chaseDir = toPlayer.normalize();
        enemy.position.addInPlace(chaseDir.scale(CONFIG.enemy.moveSpeed * deltaSeconds));
      } else if (enemyState.attackCooldown <= 0 && enemyState.attackTimer <= 0 && distanceToPlayer <= CONFIG.enemy.attackRange) {
        enemyState.attackTimer = CONFIG.enemy.attackDuration;
        enemyState.attackCooldown = CONFIG.enemy.attackCooldown;
        enemyState.attackHitDone = false;
      }

      if (enemyState.attackTimer > 0) {
        enemyState.attackTimer -= deltaSeconds;
        tryEnemyAttackHit();
      }

      fxState.feedbackTimer = Math.max(0, fxState.feedbackTimer - deltaSeconds);
      if (fxState.feedbackTimer <= 0) {
        fxState.feedbackText = "";
      }
      fxState.playerAttackFxTimer = Math.max(0, fxState.playerAttackFxTimer - deltaSeconds);
    },

    getUiState() {
      return {
        playerHp: Math.ceil(playerState.hp),
        playerMaxHp: CONFIG.player.maxHp,
        enemyHp: Math.ceil(enemyState.hp),
        enemyMaxHp: CONFIG.enemy.maxHp,
        phase: gameState.phase,
        feedbackText: fxState.feedbackText,
      };
    },

    canMovePlayer() {
      return gameState.phase === "playing" && !playerState.isDodging;
    },

    isPlayerGuarding() {
      return playerState.isGuarding;
    },

    getFxState() {
      return {
        playerAttacking: playerState.attackTimer > 0,
        playerDodging: playerState.isDodging,
        playerGuarding: playerState.isGuarding,
        enemyAttacking: enemyState.attackTimer > 0,
        playerAttackFxTimer: fxState.playerAttackFxTimer,
      };
    },
  };
}

function createPlayerController(player, camera, input, battleSystem) {
  const cameraForward = BABYLON.Vector3.Zero();
  const cameraRight = BABYLON.Vector3.Zero();
  const movement = BABYLON.Vector3.Zero();
  const lastMoveDirection = new BABYLON.Vector3(0, 0, 1);

  return {
    update(deltaSeconds) {
      const moveInput = input.getMoveVector();

      cameraForward.copyFrom(camera.getForwardRay().direction);
      cameraForward.y = 0;
      if (cameraForward.lengthSquared() > 0) cameraForward.normalize();
      else cameraForward.set(0, 0, 1);

      BABYLON.Vector3.CrossToRef(BABYLON.Axis.Y, cameraForward, cameraRight);
      cameraRight.normalize();

      movement.copyFromFloats(0, 0, 0);
      movement.addInPlace(cameraRight.scale(moveInput.x));
      movement.addInPlace(cameraForward.scale(moveInput.y));

      if (movement.lengthSquared() > 0) {
        movement.normalize();
        lastMoveDirection.copyFrom(movement);
      }

      battleSystem.update(deltaSeconds, lastMoveDirection);

      if (battleSystem.canMovePlayer() && movement.lengthSquared() > 0) {
        player.position.addInPlace(movement.scale(CONFIG.player.moveSpeed * deltaSeconds));
      }

      const facingDir = movement.lengthSquared() > 0 ? movement : lastMoveDirection;
      if (facingDir.lengthSquared() > 0) {
        const yaw = Math.atan2(facingDir.x, facingDir.z);
        const target = BABYLON.Quaternion.FromEulerAngles(0, yaw, 0);
        if (!player.rotationQuaternion) player.rotationQuaternion = BABYLON.Quaternion.Identity();
        player.rotationQuaternion = BABYLON.Quaternion.Slerp(
          player.rotationQuaternion,
          target,
          Math.min(1, CONFIG.player.rotationSpeed * deltaSeconds)
        );
      }
    },
  };
}

function createScene() {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 3,
    12,
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 18;

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.95;

  BABYLON.MeshBuilder.CreateGround("ground", { width: 16, height: 16 }, scene);

  const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.4 }, scene);
  player.position.y = 1;
  player.rotationQuaternion = BABYLON.Quaternion.Identity();
  const playerMat = new BABYLON.StandardMaterial("playerMat", scene);
  playerMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 1);
  player.material = playerMat;

  const enemy = BABYLON.MeshBuilder.CreateCapsule("enemy", { height: 2, radius: 0.4 }, scene);
  enemy.position = new BABYLON.Vector3(0, 1, 5);
  enemy.rotationQuaternion = BABYLON.Quaternion.Identity();
  const enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
  enemyMat.diffuseColor = new BABYLON.Color3(1, 0.65, 0.65);
  enemy.material = enemyMat;

  const input = createInputController(scene);
  const battleSystem = createBattleSystem(player, enemy, input);
  const playerController = createPlayerController(player, camera, input, battleSystem);

  const playerHpEl = document.getElementById("playerHp");
  const enemyHpEl = document.getElementById("enemyHp");
  const battleMessageEl = document.getElementById("battleMessage");
  const actionFeedbackEl = document.getElementById("actionFeedback");

  scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    playerController.update(deltaSeconds);
    camera.setTarget(player.position);

    const ui = battleSystem.getUiState();
    const fx = battleSystem.getFxState();
    playerHpEl.textContent = `플레이어 HP: ${ui.playerHp} / ${ui.playerMaxHp}`;
    enemyHpEl.textContent = `적 HP: ${ui.enemyHp} / ${ui.enemyMaxHp}`;
    actionFeedbackEl.textContent = ui.feedbackText;

    if (fx.playerDodging) {
      playerMat.emissiveColor = new BABYLON.Color3(0.2, 0.9, 1);
    } else if (fx.playerGuarding) {
      playerMat.emissiveColor = new BABYLON.Color3(0.2, 0.45, 1);
    } else if (fx.playerAttacking || fx.playerAttackFxTimer > 0) {
      playerMat.emissiveColor = new BABYLON.Color3(1, 0.45, 0.2);
    } else {
      playerMat.emissiveColor = BABYLON.Color3.Black();
    }

    enemyMat.emissiveColor = fx.enemyAttacking
      ? new BABYLON.Color3(1, 0.2, 0.2)
      : BABYLON.Color3.Black();

    if (ui.phase === "clear") battleMessageEl.textContent = "층 클리어";
    else if (ui.phase === "defeat") battleMessageEl.textContent = "패배";
    else battleMessageEl.textContent = "";
  });

  return scene;
}

const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
