(function initInventory(global) {
  function createInventoryState() {
    return {
      spellBooks: [],
      grimoires: [],
      magicList: [],
      externalManualCount: 0,
      internalManualCount: 0,
      swordEnergyCount: 0,
      martialManualTicket: 0,
      skillResetTicketCount: 0,
    };
  }

  function useMartialManual(player, inventory, type) {
    if (!player.manualUseCounts) player.manualUseCounts = { external: 0, internal: 0 };

    if (type === "external" && inventory.externalManualCount > 0) {
      inventory.externalManualCount -= 1;
      player.manualUseCounts.external += 1;
      player.growth.recalculate(player.swordStage, player.level, player.manualUseCounts, player.multiCastingCount);
      return true;
    }
    if (type === "internal" && inventory.internalManualCount > 0) {
      inventory.internalManualCount -= 1;
      player.manualUseCounts.internal += 1;
      player.growth.recalculate(player.swordStage, player.level, player.manualUseCounts, player.multiCastingCount);
      return true;
    }
    if (type === "sword" && inventory.swordEnergyCount > 0) {
      inventory.swordEnergyCount -= 1;
      player.swordStage = Math.min(6, player.swordStage + 1);
      player.growth.recalculate(player.swordStage, player.level, player.manualUseCounts, player.multiCastingCount);
      return true;
    }
    return false;
  }

  function consumeSkillResetTicket(inventory) {
    if (!inventory || inventory.skillResetTicketCount <= 0) return false;
    inventory.skillResetTicketCount -= 1;
    return true;
  }

  global.createInventoryState = createInventoryState;
  global.useMartialManual = useMartialManual;
  global.consumeSkillResetTicket = consumeSkillResetTicket;
})(window);
