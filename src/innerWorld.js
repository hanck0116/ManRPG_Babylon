(function initInnerWorld(global) {
  function createInnerWorldState() {
    return {
      active: false,
      step: "none", // recovery -> reward -> stats -> next
      rewardChosen: false,
      statsDone: false,
      rewardGranted: false,
    };
  }

  global.createInnerWorldState = createInnerWorldState;
})(window);
