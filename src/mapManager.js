(function initMapManager(global) {
  const MAP_STATE = {
    FLOOR_COMBAT: "FLOOR_COMBAT",
    INNER_WORLD: "INNER_WORLD",
  };

  function createMapManager(scene) {
    let state = MAP_STATE.FLOOR_COMBAT;
    let activeNodes = [];
    let activeInteractables = [];

    function clearCurrentMap() {
      activeInteractables = [];
      activeNodes.forEach((node) => {
        if (node && !node.isDisposed()) node.dispose();
      });
      activeNodes = [];
    }

    function setMapFromFactory(factory, context) {
      clearCurrentMap();
      const result = factory(scene, context) || {};
      activeNodes = result.nodes || [];
      activeInteractables = result.interactables || [];
      return result;
    }

    function showFloorCombatMap(enemyDescriptor, context) {
      state = MAP_STATE.FLOOR_COMBAT;
      const mapId = enemyDescriptor?.mapId || "defaultCylinderRoom";
      const mapFactory = global.FloorMaps[mapId] || global.FloorMaps.defaultCylinderRoom;
      return setMapFromFactory(mapFactory, context);
    }

    function showInnerWorldMap(context) {
      state = MAP_STATE.INNER_WORLD;
      return setMapFromFactory(global.InnerWorldMap.floatingIsland, context);
    }

    return {
      getState: () => state,
      getInteractables: () => activeInteractables,
      clearCurrentMap,
      showFloorCombatMap,
      showInnerWorldMap,
    };
  }

  global.MAP_STATE = MAP_STATE;
  global.createMapManager = createMapManager;
})(window);
