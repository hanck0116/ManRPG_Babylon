(function initModelLoader(global) {
  function disposeChildren(root) {
    const children = root.getChildMeshes ? root.getChildMeshes(false) : [];
    children.forEach((mesh) => {
      if (mesh.metadata?.fallbackVisual) return;
      mesh.dispose();
    });
  }

  async function attachModel(scene, root, registryKey, fallbackMesh) {
    const registry = global.ManRPGModelRegistry || {};
    const entry = registry[registryKey];
    if (!entry || !global.BABYLON?.SceneLoader?.ImportMeshAsync) {
      if (fallbackMesh) fallbackMesh.setEnabled(true);
      return { loaded: false, fallback: true };
    }

    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync("", entry.rootUrl, entry.fileName, scene);
      if (fallbackMesh) fallbackMesh.setEnabled(false);
      result.meshes.forEach((mesh) => {
        if (mesh === root) return;
        mesh.parent = root;
        mesh.isPickable = false;
      });
      return { loaded: true, meshes: result.meshes };
    } catch (error) {
      if (fallbackMesh) fallbackMesh.setEnabled(true);
      return { loaded: false, fallback: true, error };
    }
  }

  function clearModel(root, fallbackMesh) {
    disposeChildren(root);
    if (fallbackMesh) fallbackMesh.setEnabled(true);
  }

  global.ManRPGModelLoader = { attachModel, clearModel };
})(window);
