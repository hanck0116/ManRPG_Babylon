(function initModelRegistry(global) {
  global.ManRPGModelRegistry = {
    player: { rootUrl: "assets/models/player/", fileName: "player.glb" },
    enemyDefault: { rootUrl: "assets/models/enemies/", fileName: "default_enemy.glb" },
    rewardDevice: { rootUrl: "assets/models/innerworld/", fileName: "reward_device.glb" },
    storage: { rootUrl: "assets/models/innerworld/", fileName: "storage.glb" },
    mantraStatue: { rootUrl: "assets/models/innerworld/", fileName: "mantra_statue.glb" },
    shop: { rootUrl: "assets/models/innerworld/", fileName: "shop.glb" },
    trainingRoom: { rootUrl: "assets/models/innerworld/", fileName: "training_room.glb" },
    nextGate: { rootUrl: "assets/models/innerworld/", fileName: "next_gate.glb" },
    fallback: { rootUrl: "assets/models/fallback/", fileName: "fallback.glb" },
  };
})(window);
