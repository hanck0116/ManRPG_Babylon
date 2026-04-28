(function initStatCaps(global) {
  function getStatCap(level) {
    return level < 80 ? level + 20 : 100;
  }
  global.getStatCap = getStatCap;
})(window);
