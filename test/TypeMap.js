/* eslint-env node, mocha */

import MemoryInStream from "../src/MemoryInStream.js";
import MemoryOutStream from "../src/MemoryOutStream.js";
import Encoder from "../src/Encoder.js";
import Decoder from "../src/Decoder.js";
import TypeMapHandler from "../src/TypeMapHandler.js";
import TagHandler from "../src/TagHandler.js";

describe("TypeMap", () => {

  // This clumsiness is because we want to run these tests in the browser,
  // which can't resolve node_modules
  let assert;
  before(done => {
    if (typeof chai === "undefined") {
      import("chai")
      .then(chai => {
        assert = chai.assert;
        done();
      });
    }
    else {
      assert = chai.assert;
      done();
    }
  });

  function UNit() {}

  function superSimple(opts) {
    return () => {
      class Simple {
        data = "simple_data";
        constructor(name = "simple_name") {
          this.name = name;
        }
        func() { return "simple_func"; }
      }

      const simple = new Simple();

      const tagger = new (TypeMapHandler(TagHandler))(opts);
      const frozen = Encoder.encode(simple, tagger);
      //console.debug(frozen.length);
      const thawed = Decoder.decode(frozen, tagger);
      assert.deepEqual(thawed, simple);
    };
  }

  it("super simple", superSimple());
  it("super simple with mapClassNames", superSimple({mapClassNames:true}));

  function remap(opts = {}) {
    return () => {
      class Wibble {
        data = "wibble";
        constructor(name) {
          this.name = name;
        }
        func() { return "wibble"; }
      }

      const modified_wibble = new Wibble('modified_wibble');
      modified_wibble.data = "data_wibble";

      const simple = {
        mod: modified_wibble,
        mod_again: modified_wibble,
        simple: new Wibble('simple Wibble')
      };

      class Bobble {
        // should inherit data
        constructor(name) {
          this.name = name;
        }
        func() { return "bobble"; }
      };

      opts.typeMap = { Wibble: Bobble };
      const tagger = new (TypeMapHandler(TagHandler))(opts);

      const frozen = Encoder.encode(simple, tagger);
      //console.debug(frozen.length);
      const thawed = Decoder.decode(frozen, tagger);
      assert(thawed.simple instanceof Bobble);
      assert.equal(thawed.simple.name, "simple Wibble");
      assert.equal(thawed.simple.data, "wibble");

      assert(thawed.mod instanceof Bobble);
      assert.equal(thawed.mod.name, "modified_wibble");
      assert.equal(thawed.mod.data, "data_wibble");
      assert.deepEqual(thawed.mod_again, thawed.mod);
    };
  };

  it("remap", remap({}));
  it("remap with mapClassNames", remap({ mapClassNames: true }));
  
  function unencodableClassName(opts = {}) {
    return () => {
      class _Wibble {
        strap = "original";
        strop() { return "blah"; }
      }
      const frood = new _Wibble('frood1');
      frood.strap = "modified";
      const simple = {
        obj1: frood,
        obj2: frood,
        obj3: new _Wibble('not frood')
      };
      opts.typeMap = { _Wibble: _Wibble };
      const tagger = new (TypeMapHandler(TagHandler))(opts);

      const frozen = Encoder.encode(simple, tagger);
      //console.debug(frozen.length);
      const thawed = Decoder.decode(frozen, tagger);
      assert(thawed.obj1 instanceof _Wibble);
      assert(thawed.obj2 instanceof _Wibble);
      assert(thawed.obj3 instanceof _Wibble);
      assert.deepEqual(thawed, simple);
    };
  }

  it("unencodeable class name", unencodableClassName());
  it("unencodeable class name, mapClassNames", unencodableClassName({mapClassNames:true}));
  
  function simpleMixins(opts = {}) {
    return () => {
      class Gibber {
        constructor() {}
        obj() { return true; }
      }
      // add a mixin
      const mix = {
        mixin() { return true; }
      };
      Object.assign(Gibber.prototype, mix);

      opts.typeMap = { Gibber: Gibber };
      const tagger = new (TypeMapHandler(TagHandler))(opts);

      const mixedup = new Gibber();
      assert(mixedup.obj());
      assert(mixedup.mixin());
      
      const frozen = Encoder.encode(mixedup, tagger);
      //console.debug(frozen.length);
      const thawed = Decoder.decode(frozen, tagger);

      assert(thawed.obj());
      assert(thawed.mixin());
    };
  }
  it("simple mixins", simpleMixins());
  it("simple mixins, map class names", simpleMixins({mapClassNames:true}));

  function wrappingMixins(opts = {}) {
    return () => {
      class Anemone {
        a = "Anemone";
        A() { return "Anemone"; }
      }

      const mixin = superclass => class Bryozoan extends superclass {
        b = "Bryozoan";
        B() { return "Bryozoan"; }
      };

      class Cnidarian extends mixin(Anemone) {
        c = "Cnidarian";
        C() { return "Cnidarian"; }
      }

      const mixedup = new Cnidarian();
      assert.equal(mixedup.A(), "Anemone");
      assert.equal(mixedup.B(), "Bryozoan");
      assert.equal(mixedup.C(), "Cnidarian");

      // Because Cnidarian is missing from the encoding typeMap, mixedup
      // will be serialised with the mixin class Bryozoan.

      opts.typeMap = { Bryozoan: Anemone };
      const inTag = new (TypeMapHandler(TagHandler))(opts);
      const frozen = Encoder.encode(mixedup, inTag/*, //console.debug*/);
      //console.debug(frozen.length);
      // To deserialise accurately we have to map a serialised object
      // of class Bryozoan to the original class Cnidarian.
      opts.typeMap = { Bryozoan: Cnidarian };
      const outTag = new (TypeMapHandler(TagHandler))(opts);
      const thawed = Decoder.decode(frozen, outTag/*, console.debug*/);
      //console.debug(thawed);
      assert(thawed instanceof Anemone);
      // Bryozoan is not defined, it's a mixin
      assert(thawed instanceof Cnidarian);

      assert.equal(thawed.a, "Anemone");
      assert.equal(thawed.A(), "Anemone");
      assert.equal(thawed.b, "Bryozoan");
      assert.equal(thawed.B(), "Bryozoan");
      assert.equal(thawed.c, "Cnidarian");
      assert.equal(thawed.C(), "Cnidarian");
    };
  }
  it("wrapping mixins", wrappingMixins());
  it("wrapping mixins, map class names", wrappingMixins({mapClassNames:true}));

  function bigArray(opts = {}) {
    return () => {
      class EnormouslyLongName {
        constructor(i) {
          this.value = i;
        }
      };
      opts.typeMap = { EnormouslyLongName: EnormouslyLongName };
      const data = [];
      for (let i = 0; i < 10000; i++)
        data[i] = new EnormouslyLongName(i);
      const tagger = new (TypeMapHandler(TagHandler))(opts);
      const frozen = Encoder.encode(data, tagger/*, console.debug*/);
      //console.debug(frozen.length);
      const thawed = Decoder.decode(frozen, tagger);
      assert.deepEqual(data, thawed);
    };
  }

  it("big array", bigArray());
  it("big array, map class names", bigArray({mapClassNames:true}));
});
