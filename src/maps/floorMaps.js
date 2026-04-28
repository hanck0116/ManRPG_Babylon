(function initFloorMaps(global) {
  function createMaterial(scene, name, diffuse, emissive, alpha = 1) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = diffuse;
    mat.emissiveColor = emissive;
    mat.alpha = alpha;
    return mat;
  }

  function defaultCylinderRoom(scene, context) {
    const nodes = [];
    const radius = 9;
    const wallHeight = 6;

    const floor = BABYLON.MeshBuilder.CreateDisc("floorRoomDisc", { radius, tessellation: 64 }, scene);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = 0.02;
    floor.material = createMaterial(
      scene,
      `floorRoomMat_${context.floor}`,
      new BABYLON.Color3(0.17, 0.17, 0.2),
      new BABYLON.Color3(0.03, 0.03, 0.06)
    );
    nodes.push(floor);

    const wall = BABYLON.MeshBuilder.CreateCylinder(
      "floorRoomWall",
      { height: wallHeight, diameter: radius * 2, tessellation: 64, sideOrientation: BABYLON.Mesh.BACKSIDE },
      scene
    );
    wall.position.y = wallHeight / 2;
    wall.material = createMaterial(
      scene,
      `floorRoomWallMat_${context.floor}`,
      new BABYLON.Color3(0.08, 0.08, 0.12),
      new BABYLON.Color3(0.02, 0.02, 0.03),
      0.96
    );
    nodes.push(wall);

    const rim = BABYLON.MeshBuilder.CreateTorus("floorRoomRim", { diameter: radius * 2.02, thickness: 0.15 }, scene);
    rim.position.y = 0.1;
    rim.rotation.x = Math.PI / 2;
    rim.material = createMaterial(
      scene,
      `floorRoomRimMat_${context.floor}`,
      new BABYLON.Color3(0.22, 0.22, 0.28),
      new BABYLON.Color3(0.02, 0.02, 0.02)
    );
    nodes.push(rim);

    return { nodes, cameraMode: "combat" };
  }

  function beastArena(scene) {
    return defaultCylinderRoom(scene, { floor: 0 });
  }

  function mageChamber(scene) {
    return defaultCylinderRoom(scene, { floor: 0 });
  }

  function bossVoidRoom(scene) {
    return defaultCylinderRoom(scene, { floor: 0 });
  }

  global.FloorMaps = {
    defaultCylinderRoom,
    beastArena,
    mageChamber,
    bossVoidRoom,
  };
})(window);
