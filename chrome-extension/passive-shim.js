// Page-level passive shim: defaults scroll/wheel/touch listeners to passive when not specified
(function(){
  const origAdd = EventTarget.prototype.addEventListener;
  const passiveTypes = new Set(['scroll','wheel','touchstart','touchmove']);
  EventTarget.prototype.addEventListener = function(type, listener, options){
    try {
      if (passiveTypes.has(type)) {
        if (options === undefined) {
          options = { passive: true };
        } else if (typeof options === 'boolean') {
          options = { capture: options, passive: true };
        } else if (typeof options === 'object' && options !== null && !('passive' in options)) {
          options = Object.assign({}, options, { passive: true });
        }
      }
    } catch(e){ /* no-op */ }
    return origAdd.call(this, type, listener, options);
  };
})();
