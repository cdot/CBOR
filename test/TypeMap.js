/* eslint-env node, mocha */

import { MemoryInStream } from "../src/MemoryInStream.js";
import { MemoryOutStream } from "../src/MemoryOutStream.js";
import { Encoder } from "../src/Encoder.js";
import { Decoder } from "../src/Decoder.js";
import { TypeMapHandler } from "../src/TypeMapHandler.js";
import { TagHandler } from "../src/TagHandler.js";

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

  it("instance-ref", () => {

    class Wibble {
      strap = "original";
      strop() { return "blah"; }
    }
    const frood = new Wibble('frood1');
    frood.strap = "modified";
    const simple = {
      obj1: frood,
      obj2: frood,
      obj3: new Wibble('not frood')
    };
    const tagger = new (TypeMapHandler(TagHandler))({
      typeMap: { Wibble: Wibble }
    });

    const frozen = Encoder.encode(simple, tagger);
    const thawed = Decoder.decode(frozen, tagger);

    assert(thawed.obj1 instanceof Wibble);
    assert(thawed.obj2 instanceof Wibble);
    assert(thawed.obj3 instanceof Wibble);
    assert.deepEqual(thawed, simple);
  });

  it("simple mixins", () => {
    class Gibber {
      constructor() {}
      obj() { return true; }
    }
    // add a mixin
    const mix = {
      mixin() { return true; }
    };
    Object.assign(Gibber.prototype, mix);

    const tagger = new (TypeMapHandler(TagHandler))({
      typeMap: { Gibber: Gibber }});

    const mixedup = new Gibber();
    assert(mixedup.obj());
    assert(mixedup.mixin());
    
    const frozen = Encoder.encode(mixedup, tagger);
    const thawed = Decoder.decode(frozen, tagger);

    assert(thawed.obj());
    assert(thawed.mixin());
  });

  it("wrapping mixins", () => {
    class A {
      a = "A";
      A() { return "A"; }
    }

    const mixin = superclass => class B extends superclass {
      b = "B";
      B() { return "B"; }
    };

    class C extends mixin(A) {
      c = "C";
      C() { return "C"; }
    }

    const mixedup = new C();
    assert.equal(mixedup.A(), "A");
    assert.equal(mixedup.B(), "B");
    assert.equal(mixedup.C(), "C");

    // Because C is missing from the typeMap, mixedup will be
    // serialised with the mixin class "B". To deserialise we
    // have to map serialised object of class B to the original class
    // C

    const inTag = new (TypeMapHandler(TagHandler))({
      typeMap: { B: A }});
    const frozen = Encoder.encode(mixedup, inTag);

    const outTag = new (TypeMapHandler(TagHandler))({
      typeMap: { B: C }});
    const thawed = Decoder.decode(frozen, outTag);

    assert(thawed instanceof A);
    // B is not defined, it's a mixin
    assert(thawed instanceof C);

    assert.equal(thawed.a, "A");
    assert.equal(thawed.A(), "A");
    assert.equal(thawed.b, "B");
    assert.equal(thawed.B(), "B");
    assert.equal(thawed.c, "C");
    assert.equal(thawed.C(), "C");
  });
});
