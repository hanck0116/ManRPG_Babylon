const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);

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

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  const ground = BABYLON.MeshBuilder.CreateGround(
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

  return scene;
}

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
