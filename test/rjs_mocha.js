/**
 * requiresjs configuration for mocha tests in the browser
 */
requirejs.config({
  // Make paths relative to the location of the HTML.
  baseUrl: "..",
  paths: {
    ut: "test/ut",
    chai: "node_modules/chai/chai",
    mocha: "node_modules/mocha/mocha"
  }
});

requirejs([
  "mocha"
], mocha => {
  mocha.setup('bdd');

  requirejs([
    "ut!test/EncodeDecode",
    "ut!test/IDREF",
    "ut!test/TypeMap",
    "ut!test/KeyDictionary"
  ], () => mocha.run());
});

