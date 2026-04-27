const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);

function createInputController(scene) {
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

  const keyMap = {
    KeyW: "w",
    KeyA: "a",
    KeyS: "s",
    KeyD: "d",
  };

  scene.onKeyboardObservable.add((kbInfo) => {
    const key = keyMap[kbInfo.event.code];
    if (!key) return;

    const isDown = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
    const isUp = kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP;

    if (isDown) keys[key] = true;
    if (isUp) keys[key] = false;
  });

  return {
    // 향후 모바일 조이스틱 입력을 여기에 합쳐서 반환하면 됨
    getMoveVector() {
      let x = 0;
      let z = 0;

      if (keys.w) z += 1;
      if (keys.s) z -= 1;
      if (keys.a) x -= 1;
      if (keys.d) x += 1;

      const move = new BABYLON.Vector2(x, z);
      if (move.lengthSquared() > 1) {
        move.normalize();
      }

      return move;
    },

    // 향후 공격/회피/락온 입력 확장용 상태 영역
    getActionState() {
      return {
        attack: false,
        dodge: false,
        lockOn: false,
      };
    },
  };
}

function createPlayerController(player, camera, input) {
  const moveSpeed = 4.5;
  const rotationSpeed = 10;

  const cameraForward = BABYLON.Vector3.Zero();
  const cameraRight = BABYLON.Vector3.Zero();
  const movement = BABYLON.Vector3.Zero();

  return {
    update(deltaSeconds) {
      const moveInput = input.getMoveVector();

      cameraForward.copyFrom(camera.getForwardRay().direction);
      cameraForward.y = 0;
      if (cameraForward.lengthSquared() === 0) {
        cameraForward.set(0, 0, 1);
      } else {
        cameraForward.normalize();
      }

      BABYLON.Vector3.CrossToRef(BABYLON.Axis.Y, cameraForward, cameraRight);
      cameraRight.normalize();

      movement.copyFromFloats(0, 0, 0);
      movement.addInPlace(cameraRight.scale(moveInput.x));
      movement.addInPlace(cameraForward.scale(moveInput.y));

      if (movement.lengthSquared() > 0) {
        movement.normalize();
        player.position.addInPlace(movement.scale(moveSpeed * deltaSeconds));

        const targetYaw = Math.atan2(movement.x, movement.z);
        const targetRotation = BABYLON.Quaternion.FromEulerAngles(0, targetYaw, 0);

        if (!player.rotationQuaternion) {
          player.rotationQuaternion = BABYLON.Quaternion.Identity();
        }

        player.rotationQuaternion = BABYLON.Quaternion.Slerp(
          player.rotationQuaternion,
          targetRotation,
          Math.min(1, rotationSpeed * deltaSeconds)
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

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  light.intensity = 0.95;

  BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 12, height: 12 },
    scene
  );

  const player = BABYLON.MeshBuilder.CreateCapsule(
    "player",
    { height: 2, radius: 0.4 },
    scene
  );

  player.position.y = 1;

  const enemy = BABYLON.MeshBuilder.CreateCapsule(
    "enemy",
    { height: 2, radius: 0.4 },
    scene
  );

  enemy.position = new BABYLON.Vector3(0, 1, 4);

  const input = createInputController(scene);
  const playerController = createPlayerController(player, camera, input);

  scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    playerController.update(deltaSeconds);

    // 카메라가 항상 플레이어를 따라가도록 타겟을 갱신
    camera.setTarget(player.position);
  });

  return scene;
}

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
