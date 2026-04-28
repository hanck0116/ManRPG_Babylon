(function initShop(global) {
  function buyShopItem(state, key) {
    if (!state?.canTrade) return false;
    if (key === "buy_hp_pack" && state.progression.coins >= 1) {
      state.progression.coins -= 1;
      state.inventory.hpPotion += 2;
      return true;
    }
    if (key === "buy_mp_pack" && state.progression.coins >= 1) {
      state.progression.coins -= 1;
      state.inventory.mpPotion += 2;
      return true;
    }
    return false;
  }

  function sellShopItem(state, key) {
    if (!state?.canTrade) return false;
    if (key === "sell_hp_3" && state.inventory.hpPotion >= 3) {
      state.inventory.hpPotion -= 3;
      state.progression.coins += 1;
      return true;
    }
    if (key === "sell_mp_3" && state.inventory.mpPotion >= 3) {
      state.inventory.mpPotion -= 3;
      state.progression.coins += 1;
      return true;
    }
    return false;
  }

  global.buyShopItem = buyShopItem;
  global.sellShopItem = sellShopItem;
})(window);
