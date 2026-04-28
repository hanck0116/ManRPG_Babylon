(function initUiHelpers(global) {
  function setVisible(el, visible) {
    el.classList.toggle("hidden", !visible);
  }

  global.uiHelpers = { setVisible };
})(window);
