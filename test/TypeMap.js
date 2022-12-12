/* eslint-env node, mocha */

import Encoder from "../js/Encoder.mjs";
import Decoder from "../js/Decoder.mjs";
import MemoryInStream from "../js/MemoryInStream.mjs";
import MemoryOutStream from "../js/MemoryOutStream.mjs";
import TypeMapMixin from "../js/TypeMapMixin.mjs";
import TagHandler from "../js/TagHandler.mjs";
import { assert } from "chai";

describe("TypeMap", () => {

  function UNit() {}

  it("instance-ref", () => {

    class Wibble {
      strap = "original";
      strop() { return "blah"; }
    }
    let frood = new Wibble('frood1');
    frood.strap = "modified";
    let simple = {
      obj1: frood,
      obj2: frood,
      obj3: new Wibble('not frood')
    };
    const tagger = new (TypeMapMixin(TagHandler))({
      typeMap: { Wibble: Wibble }});

    let outs = new MemoryOutStream();
    const encoder = new Encoder(outs, tagger);
    //encoder.debug = console.debug;
    encoder.encode(simple);
    let frozen = outs.Uint8Array;

    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    let thawed = decoder.decode();

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

    const tagger = new (TypeMapMixin(TagHandler))({
      typeMap: { Gibber: Gibber }});

    let mixedup = new Gibber();
    assert(mixedup.obj());
    assert(mixedup.mixin());
    
    let outs = new MemoryOutStream();
    const encoder = new Encoder(outs, tagger);
    //encoder.debug = console.debug;
    encoder.encode(mixedup);
    let frozen = outs.Uint8Array;

    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    let thawed = decoder.decode();

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

    let mixedup = new C();
    assert.equal(mixedup.A(), "A");
    assert.equal(mixedup.B(), "B");
    assert.equal(mixedup.C(), "C");

    // Because C is missing from the typeMap, mixedup will be
    // serialised with the mixin class "B". To deserialise we
    // have to map serialised object of class B to the original class
    // C

    let tagger = new (TypeMapMixin(TagHandler))({
      typeMap: { B: A }});

    let outs = new MemoryOutStream();
    const encoder = new Encoder(outs, tagger);
    //encoder.debug = console.debug;
    encoder.encode(mixedup);
    let frozen = outs.Uint8Array;

    tagger = new (TypeMapMixin(TagHandler))({
      typeMap: { B: C }});
    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    let thawed = decoder.decode();

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
