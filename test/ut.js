// Tiny requirejs plugin to support loading .ut files in the
// browser
define(() => {
  return {
    load : function(name, req, onLoad, config){
      let url = req.toUrl(name).replace(/\.js$/, '.ut');
      req([url], mod => onLoad(mod));
    },
    normalize : url => `${url}.ut?ut=`
  };
});
