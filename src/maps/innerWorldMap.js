(function initInnerWorldMap(global) {
  function material(scene, name, diffuse, emissive, alpha = 1) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = diffuse;
    mat.emissiveColor = emissive;
    mat.alpha = alpha;
    return mat;
  }

  function createInteractable(scene, type, label, position, color, shape) {
    let mesh;
    if (shape === "torus") mesh = BABYLON.MeshBuilder.CreateTorus(type, { diameter: 1.4, thickness: 0.18 }, scene);
    else if (shape === "box") mesh = BABYLON.MeshBuilder.CreateBox(type, { width: 1.35, height: 1.35, depth: 1.35 }, scene);
    else if (shape === "gate") mesh = BABYLON.MeshBuilder.CreateTorus(type, { diameter: 2.2, thickness: 0.16 }, scene);
    else mesh = BABYLON.MeshBuilder.CreateCylinder(type, { height: 1.6, diameter: 1.0, tessellation: 18 }, scene);
    mesh.position.copyFrom(position);
    mesh.material = material(scene, `${type}Mat`, color, color.scale(0.25));
    mesh.metadata = { interactableType: type, label };
    return mesh;
  }

  function createMantraStatue(scene, mantra, position) {
    const group = new BABYLON.TransformNode("mantraStatueRoot", scene);
    group.position.copyFrom(position);
    const nodes = [group];
    const color = new BABYLON.Color3(0.62, 0.68, 0.78);
    const glow = new BABYLON.Color3(0.12, 0.16, 0.22);
    const mat = material(scene, "mantraStatueMat", color, glow);

    const base = BABYLON.MeshBuilder.CreateCylinder("mantraStatueBase", { height: 0.35, diameter: 1.6, tessellation: 20 }, scene);
    base.parent = group;
    base.position.y = 0.18;
    base.material = mat;
    nodes.push(base);

    let icon;
    if (mantra.includes("검")) {
      icon = BABYLON.MeshBuilder.CreateBox("statueSword", { width: 0.18, height: 2.1, depth: 0.28 }, scene);
      icon.position.y = 1.5;
    } else if (mantra.includes("천사") || mantra.includes("피닉스")) {
      icon = BABYLON.MeshBuilder.CreateTorus("statueWingRing", { diameter: 1.4, thickness: 0.08 }, scene);
      icon.position.y = 1.45;
    } else if (mantra.includes("악마") || mantra.includes("야수")) {
      icon = BABYLON.MeshBuilder.CreateSphere("statueBeast", { diameter: 1.1, segments: 16 }, scene);
      icon.position.y = 1.25;
    } else if (mantra.includes("눈")) {
      icon = BABYLON.MeshBuilder.CreateTorus("statueEye", { diameter: 1.2, thickness: 0.12 }, scene);
      icon.position.y = 1.35;
      icon.rotation.x = Math.PI / 2;
    } else {
      icon = BABYLON.MeshBuilder.CreateCylinder("statuePillar", { height: 1.7, diameter: 0.58, tessellation: 16 }, scene);
      icon.position.y = 1.15;
    }
    icon.parent = group;
    icon.material = mat;
    icon.metadata = { interactableType: "mantraStatue", label: `만트라 석상: ${mantra}` };
    nodes.push(icon);
    return { root: group, nodes, mesh: icon };
  }

  function floatingIsland(scene, context) {
    const nodes = [];
    const interactables = [];

    const islandTop = BABYLON.MeshBuilder.CreateDisc("innerIslandTop", { radius: 7.2, tessellation: 80 }, scene);
    islandTop.rotation.x = Math.PI / 2;
    islandTop.position.y = 0.05;
    islandTop.material = material(scene, "innerIslandTopMat", new BABYLON.Color3(0.2, 0.2, 0.27), new BABYLON.Color3(0.04, 0.04, 0.08));
    nodes.push(islandTop);

    const islandBody = BABYLON.MeshBuilder.CreateCylinder("innerIslandBody", { height: 2.4, diameterTop: 12.6, diameterBottom: 4.8, tessellation: 52 }, scene);
    islandBody.position.y = -1.1;
    islandBody.material = material(scene, "innerIslandBodyMat", new BABYLON.Color3(0.09, 0.1, 0.13), new BABYLON.Color3(0.01, 0.01, 0.03));
    nodes.push(islandBody);

    const starCount = Math.min(context.level || 1, 200);
    for (let i = 0; i < starCount; i++) {
      const star = BABYLON.MeshBuilder.CreateSphere(`innerStar_${i}`, { diameter: 0.13, segments: 8 }, scene);
      star.position = new BABYLON.Vector3((Math.random() - 0.5) * 86, 8 + Math.random() * 28, (Math.random() - 0.5) * 86);
      const starMat = new BABYLON.StandardMaterial(`innerStarMat_${i}`, scene);
      starMat.emissiveColor = new BABYLON.Color3(0.55 + Math.random() * 0.35, 0.65 + Math.random() * 0.3, 1);
      starMat.disableLighting = true;
      star.material = starMat;
      nodes.push(star);
    }

    const objectData = [
      ["rewardDevice", "보상 뽑기 장치", new BABYLON.Vector3(3.4, 0.7, 2.6), new BABYLON.Color3(0.95, 0.72, 0.24), "torus"],
      ["storage", "저장고", new BABYLON.Vector3(-3.4, 0.7, 2.6), new BABYLON.Color3(0.34, 0.63, 0.95), "box"],
      ["shop", "상점", new BABYLON.Vector3(4.2, 0.7, -2.2), new BABYLON.Color3(0.38, 0.84, 0.58), "cylinder"],
      ["trainingRoom", "연습실", new BABYLON.Vector3(-4.2, 0.7, -2.2), new BABYLON.Color3(0.95, 0.42, 0.36), "box"],
      ["nextGate", "다음 층 게이트", new BABYLON.Vector3(0, 1.15, -5.3), new BABYLON.Color3(0.7, 0.56, 1.0), "gate"],
    ];
    objectData.forEach(([type, label, position, color, shape]) => {
      const mesh = createInteractable(scene, type, label, position, color, shape);
      nodes.push(mesh);
      interactables.push({ type, label, mesh });
    });

    const statue = createMantraStatue(scene, context.mantra || "만트라", new BABYLON.Vector3(0, 0, 4.4));
    nodes.push(...statue.nodes);
    interactables.push({ type: "mantraStatue", label: `만트라 석상: ${context.mantra || "만트라"}`, mesh: statue.mesh });

    return { nodes, interactables, cameraMode: "inner", bounds: { arenaRadius: 6.5 } };
  }

  global.InnerWorldMap = { floatingIsland };
})(window);
