(function initShop(global) {
  const MANUAL_TICKET_PRICE = 8;

  function buyShopItem(state, key) {
    if (!state?.canTrade) return false;
    const p = state.progression; const inv = state.inventory;
    if (key === "buy_external" && p.coins >= 10) { p.coins -= 10; inv.externalManualCount += 1; return true; }
    if (key === "buy_internal" && p.coins >= 10) { p.coins -= 10; inv.internalManualCount += 1; return true; }
    if (key === "buy_sword" && p.coins >= 30) { p.coins -= 30; inv.swordEnergyCount += 1; return true; }
    if (key === "buy_ticket" && p.coins >= MANUAL_TICKET_PRICE) { p.coins -= MANUAL_TICKET_PRICE; inv.martialManualTicket += 1; return true; }
    if (key === "buy_skill_reset" && p.coins >= 25) { p.coins -= 25; inv.skillResetTicketCount += 1; return true; }
    return false;
  }

  function sellShopItem(state, key) {
    if (!state?.canTrade) return false;
    const p = state.progression; const inv = state.inventory;
    if (key === "sell_external" && inv.externalManualCount >= 1) { inv.externalManualCount -= 1; p.coins += 5; return true; }
    if (key === "sell_internal" && inv.internalManualCount >= 1) { inv.internalManualCount -= 1; p.coins += 5; return true; }
    if (key === "sell_sword" && inv.swordEnergyCount >= 1) { inv.swordEnergyCount -= 1; p.coins += 12; return true; }
    return false;
  }

  function drawMartialManualTicket(state) {
    if (!state?.canTrade || state.inventory.martialManualTicket <= 0) return null;
    state.inventory.martialManualTicket -= 1;
    return global.generateMartialManual();
  }

  global.MANUAL_TICKET_PRICE = MANUAL_TICKET_PRICE;
  global.buyShopItem = buyShopItem;
  global.sellShopItem = sellShopItem;
  global.drawMartialManualTicket = drawMartialManualTicket;
})(window);
