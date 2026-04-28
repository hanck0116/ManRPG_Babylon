(function initInnerWorldMap(global) {
  function createMaterial(scene, name, diffuse, emissive) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = diffuse;
    mat.emissiveColor = emissive;
    return mat;
  }

  function floatingIsland(scene, context) {
    const nodes = [];

    const islandTop = BABYLON.MeshBuilder.CreateDisc("innerIslandTop", { radius: 6.5, tessellation: 64 }, scene);
    islandTop.rotation.x = Math.PI / 2;
    islandTop.position.y = 0.05;
    islandTop.material = createMaterial(
      scene,
      `innerIslandTopMat_${context.floor}`,
      new BABYLON.Color3(0.24, 0.22, 0.3),
      new BABYLON.Color3(0.05, 0.04, 0.08)
    );
    nodes.push(islandTop);

    const islandBody = BABYLON.MeshBuilder.CreateCylinder(
      "innerIslandBody",
      { height: 2.2, diameterTop: 11, diameterBottom: 5.2, tessellation: 42 },
      scene
    );
    islandBody.position.y = -1.0;
    islandBody.material = createMaterial(
      scene,
      `innerIslandBodyMat_${context.floor}`,
      new BABYLON.Color3(0.11, 0.11, 0.14),
      new BABYLON.Color3(0.01, 0.01, 0.02)
    );
    nodes.push(islandBody);

    const starCount = Math.min(context.level, 200);
    for (let i = 0; i < starCount; i++) {
      const star = BABYLON.MeshBuilder.CreateSphere(`innerStar_${i}`, { diameter: 0.14 }, scene);
      star.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 80,
        8 + Math.random() * 25,
        (Math.random() - 0.5) * 80
      );
      const starMat = new BABYLON.StandardMaterial(`innerStarMat_${i}`, scene);
      starMat.emissiveColor = new BABYLON.Color3(0.6 + Math.random() * 0.4, 0.7 + Math.random() * 0.3, 1);
      starMat.disableLighting = true;
      star.material = starMat;
      nodes.push(star);
    }

    return { nodes, cameraMode: "inner" };
  }

  global.InnerWorldMap = {
    floatingIsland,
  };
})(window);
