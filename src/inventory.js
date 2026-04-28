(function initInventory(global) {
  function createInventoryState() {
    return {
      hpPotion: 0,
      mpPotion: 0,
      spellBooks: [],
      inheritanceSlots: [],
      magicList: [],
    };
  }

  function usePotion(inventory, playerState, type) {
    if (type === "hp" && inventory.hpPotion > 0) {
      inventory.hpPotion -= 1;
      playerState.hp = Math.min(playerState.maxHp, playerState.hp + 20);
      return true;
    }
    if (type === "mp" && inventory.mpPotion > 0) {
      inventory.mpPotion -= 1;
      playerState.mp = Math.min(playerState.maxMp, playerState.mp + 20);
      return true;
    }
    return false;
  }

  global.createInventoryState = createInventoryState;
  global.usePotion = usePotion;
})(window);
