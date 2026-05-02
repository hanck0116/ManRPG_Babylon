(function initFloorMaps(global) {
  function material(scene, name, diffuse, emissive, alpha = 1) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = diffuse;
    mat.emissiveColor = emissive;
    mat.alpha = alpha;
    return mat;
  }

  function cylinderRoom(scene, context, palette) {
    const nodes = [];
    const radius = palette.radius || 9;
    const wallHeight = 6;

    const floor = BABYLON.MeshBuilder.CreateDisc("floorRoomDisc", { radius, tessellation: 72 }, scene);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = 0.02;
    floor.material = material(scene, `floorMat_${context.floor}`, palette.floor, palette.floorGlow);
    nodes.push(floor);

    const wall = BABYLON.MeshBuilder.CreateCylinder(
      "floorRoomWall",
      { height: wallHeight, diameter: radius * 2, tessellation: 72, sideOrientation: BABYLON.Mesh.BACKSIDE },
      scene
    );
    wall.position.y = wallHeight / 2;
    wall.material = material(scene, `wallMat_${context.floor}`, palette.wall, palette.wallGlow, 0.95);
    nodes.push(wall);

    const rim = BABYLON.MeshBuilder.CreateTorus("floorRoomRim", { diameter: radius * 2.02, thickness: 0.15 }, scene);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.1;
    rim.material = material(scene, `rimMat_${context.floor}`, palette.rim, palette.rimGlow);
    nodes.push(rim);

    for (let i = 0; i < palette.pillars; i++) {
      const angle = (Math.PI * 2 * i) / palette.pillars;
      const pillar = BABYLON.MeshBuilder.CreateCylinder(`pillar_${i}`, { height: 2.6, diameter: 0.35, tessellation: 12 }, scene);
      pillar.position = new BABYLON.Vector3(Math.cos(angle) * (radius - 1.2), 1.3, Math.sin(angle) * (radius - 1.2));
      pillar.material = material(scene, `pillarMat_${i}_${context.floor}`, palette.rim, palette.rimGlow);
      nodes.push(pillar);
    }

    return { nodes, cameraMode: "combat", bounds: { arenaRadius: radius - 0.8 } };
  }

  function defaultCylinderRoom(scene, context) {
    return cylinderRoom(scene, context, {
      radius: 9,
      floor: new BABYLON.Color3(0.18, 0.18, 0.21),
      floorGlow: new BABYLON.Color3(0.02, 0.02, 0.04),
      wall: new BABYLON.Color3(0.08, 0.09, 0.13),
      wallGlow: new BABYLON.Color3(0.01, 0.01, 0.03),
      rim: new BABYLON.Color3(0.24, 0.25, 0.3),
      rimGlow: new BABYLON.Color3(0.02, 0.02, 0.02),
      pillars: 8,
    });
  }

  function beastArena(scene, context) {
    return cylinderRoom(scene, context, {
      radius: 8.6,
      floor: new BABYLON.Color3(0.19, 0.12, 0.11),
      floorGlow: new BABYLON.Color3(0.05, 0.015, 0.01),
      wall: new BABYLON.Color3(0.12, 0.07, 0.07),
      wallGlow: new BABYLON.Color3(0.04, 0.01, 0.01),
      rim: new BABYLON.Color3(0.34, 0.18, 0.14),
      rimGlow: new BABYLON.Color3(0.08, 0.02, 0.01),
      pillars: 6,
    });
  }

  function mageChamber(scene, context) {
    return cylinderRoom(scene, context, {
      radius: 9.4,
      floor: new BABYLON.Color3(0.11, 0.15, 0.21),
      floorGlow: new BABYLON.Color3(0.01, 0.04, 0.07),
      wall: new BABYLON.Color3(0.06, 0.09, 0.16),
      wallGlow: new BABYLON.Color3(0.01, 0.03, 0.08),
      rim: new BABYLON.Color3(0.14, 0.28, 0.38),
      rimGlow: new BABYLON.Color3(0.02, 0.08, 0.12),
      pillars: 10,
    });
  }

  function bossVoidRoom(scene, context) {
    return cylinderRoom(scene, context, {
      radius: 10,
      floor: new BABYLON.Color3(0.08, 0.06, 0.11),
      floorGlow: new BABYLON.Color3(0.04, 0.01, 0.08),
      wall: new BABYLON.Color3(0.035, 0.03, 0.06),
      wallGlow: new BABYLON.Color3(0.06, 0.01, 0.1),
      rim: new BABYLON.Color3(0.22, 0.12, 0.32),
      rimGlow: new BABYLON.Color3(0.09, 0.02, 0.16),
      pillars: 12,
    });
  }

  global.FloorMaps = { defaultCylinderRoom, beastArena, mageChamber, bossVoidRoom };
})(window);
