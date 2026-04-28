(function initInventory(global) {
  function createInventoryState() {
    return {
      spellBooks: [],
      magicList: [],
      externalManualCount: 0,
      internalManualCount: 0,
      swordEnergyCount: 0,
      martialManualTicket: 0,
    };
  }

  function useMartialManual(player, inventory, type) {
    if (type === "external" && inventory.externalManualCount > 0) {
      inventory.externalManualCount -= 1;
      player.growth.state.temporaryBonuses.maxHpMultiplier *= 1.2;
      player.growth.recalculate(player.swordStage);
      return true;
    }
    if (type === "internal" && inventory.internalManualCount > 0) {
      inventory.internalManualCount -= 1;
      player.growth.state.temporaryBonuses.maxMpMultiplier *= 1.1;
      player.growth.state.temporaryBonuses.mpRegenMultiplier *= 1.1;
      player.growth.recalculate(player.swordStage);
      return true;
    }
    if (type === "sword" && inventory.swordEnergyCount > 0) {
      inventory.swordEnergyCount -= 1;
      player.swordStage = Math.min(6, player.swordStage + 1);
      player.growth.recalculate(player.swordStage);
      return true;
    }
    return false;
  }

  global.createInventoryState = createInventoryState;
  global.useMartialManual = useMartialManual;
})(window);
