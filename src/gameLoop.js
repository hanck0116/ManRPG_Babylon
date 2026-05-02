function updateHud() {
  Data.clampVitals(game.player);
  const p = game.player;
  const d = p.officialDerivedStats;
  const enemy = battle.getEnemy();
  const spell = Data.MAGIC_BY_ID[p.equippedMagicId];
  const preparing = p.preparingSpell ? Data.MAGIC_BY_ID[p.preparingSpell.magicId] : null;
  hud.floorInfo.textContent = `Floor ${p.floor}`;
  hud.modeInfo.textContent = game.gameState;
  hud.progressInfo.textContent = `Lv ${p.level} | Stat Pts ${p.statPoints} | Coin ${p.coins} | Ticket ${p.rewardDrawTicketCount}`;
  hud.playerHp.textContent = `HP ${Math.ceil(p.currentHp)} / ${d.maxHp}`;
  hud.playerMp.textContent = `MP ${Math.floor(p.currentMp)} / ${d.maxMp} | Regen ${d.mpRegen.toFixed(1)}`;
  hud.enemyHp.textContent = game.gameState === Data.GAME_STATES.FLOOR_COMBAT && enemy.hp != null ? `적 HP ${Math.ceil(enemy.hp)} / ${enemy.maxHp}` : trainingDummy ? `더미 HP ${Math.ceil(trainingDummy.hp)} / ${trainingDummy.maxHp}` : "적 HP -";
  hud.mantraInfo.textContent = `만트라 ${p.mantra || "-"} | 검기 ${d.swordStageName}`;
  hud.spellInfo.textContent = `마법 ${spell ? spell.name : "-"} | 스킬 ${p.equippedSkillId ? p.skills[p.equippedSkillId]?.name : "-"}`;
  hud.preparedInfo.textContent = preparing ? `준비 중 ${preparing.name} ${p.preparingSpell.remaining.toFixed(1)}s` : `준비된 마법 ${p.preparedSpells.map((id) => Data.MAGIC_BY_ID[id]?.name).filter(Boolean).join(", ") || "-"}`;
  hud.actionFeedback.textContent = battle.getRuntime().feedback || "";
  hud.battleMessage.textContent = battle.getPhase() === "clear" ? "층 클리어" : game.gameState === Data.GAME_STATES.GAME_OVER ? "패배" : "";
}

function updateHint() {
  if (game.gameState !== Data.GAME_STATES.INNER_WORLD || game.innerWorld.openedUI || !nearestInnerObject) return hint.classList.add("hidden");
  hint.textContent = `${nearestInnerObject.label}: 기본 공격으로 상호작용`;
  hint.classList.remove("hidden");
}

function createScene() {
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.025, 0.028, 0.04, 1);
  camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 12, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5.5;
  camera.upperRadiusLimit = 24;
  new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0.2, 1, 0.3), scene).intensity = 0.95;
  new BABYLON.PointLight("point", new BABYLON.Vector3(0, 5, -3), scene).intensity = 0.65;

  playerRoot = new BABYLON.TransformNode("playerRoot", scene);
  playerRoot.position.y = 1;
  playerRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
  const playerMesh = BABYLON.MeshBuilder.CreateCapsule("playerCollider", { height: 2, radius: 0.42 }, scene);
  playerMesh.parent = playerRoot;
  playerMesh.material = material("playerMat", new BABYLON.Color3(0.88, 0.91, 1));
  const marker = BABYLON.MeshBuilder.CreateCylinder("playerFront", { diameterTop: 0, diameterBottom: 0.24, height: 0.35, tessellation: 4 }, scene);
  marker.parent = playerRoot;
  marker.position = new BABYLON.Vector3(0, 0.65, 0.58);
  marker.rotation.x = Math.PI / 2;
  marker.material = material("frontMat", new BABYLON.Color3(0.2, 1, 0.2));
  ManRPGModelLoader.attachModel(scene, playerRoot, "player", playerMesh);

  input = createInput();
  mapManager = createMapManager(scene);
  battle = createBattleSystem();
  currentMap = mapManager.showFloorCombatMap({ mapId: "defaultCylinderRoom" }, { floor: 1, level: 1 });

  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toast.classList.add("hidden");
    }
    const actions = input.actions();
    const move = input.move();
    let forward = camera.getForwardRay().direction;
    forward.y = 0;
    if (forward.lengthSquared() > 0) forward.normalize();
    let right = BABYLON.Vector3.Cross(BABYLON.Axis.Y, forward).normalize();
    const target = game.gameState === Data.GAME_STATES.FLOOR_COMBAT && battle.isLockOn() ? battle.getEnemy().mesh : null;
    if (target) {
      forward = target.position.subtract(playerRoot.position);
      forward.y = 0;
      if (forward.lengthSquared() > 0) forward.normalize();
      right = BABYLON.Vector3.Cross(BABYLON.Axis.Y, forward).normalize();
    }
    const dir = right.scale(move.x).add(forward.scale(move.y));
    if (dir.lengthSquared() > 0) {
      dir.normalize();
      playerRoot.rotationQuaternion = BABYLON.Quaternion.Slerp(playerRoot.rotationQuaternion, BABYLON.Quaternion.FromEulerAngles(0, Math.atan2(dir.x, dir.z), 0), Math.min(1, dt * 10));
    }
    if (game.gameState === Data.GAME_STATES.FLOOR_COMBAT) {
      battle.update(dt, dir, actions);
      if (dir.lengthSquared() > 0 && battle.getPhase() === "playing") {
        playerRoot.position.addInPlace(dir.scale(game.player.combatTuning.moveSpeed * dt));
        battle.clamp(currentMap?.bounds?.arenaRadius || 8);
      }
      if (battle.getPhase() === "clear") completeFloorOnce();
      if (game.gameState === Data.GAME_STATES.GAME_OVER) renderGameOver();
    } else if (game.gameState === Data.GAME_STATES.INNER_WORLD) {
      battle.update(dt, dir, { ...actions, guard: false });
      updateInnerActions(actions);
      if (!game.innerWorld.openedUI && dir.lengthSquared() > 0) {
        playerRoot.position.addInPlace(dir.scale(game.player.combatTuning.moveSpeed * dt));
        battle.clamp(currentMap?.bounds?.arenaRadius || 6.35);
      }
    }
    camera.setTarget(playerRoot.position);
    input.buttonState(battle.cooldowns());
    updateHud();
    updateHint();
  });
  return scene;
}

function restoreLoadedGame() {
  Data.clampVitals(game.player);
  if (game.gameState === Data.GAME_STATES.CHARACTER_CREATION) return renderCreation();
  if (game.gameState === Data.GAME_STATES.CHARACTER_CONFIRM) return renderConfirm();
  if (game.gameState === Data.GAME_STATES.INNER_WORLD) return enterInnerWorld("저장된 심상세계로 복귀");
  if (game.gameState === Data.GAME_STATES.FLOOR_COMBAT) return startFloorCombat(false);
  if (game.gameState === Data.GAME_STATES.GAME_OVER) return renderGameOver();
  renderTitle();
}

createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
renderTitle();
