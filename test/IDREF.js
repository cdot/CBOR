/* eslint-env node, mocha */

import MemoryInStream from "../src/MemoryInStream.mjs";
import MemoryOutStream from "../src/MemoryOutStream.mjs";
import Encoder from "../src/Encoder.mjs";
import Decoder from "../src/Decoder.mjs";
import IDREFHandler from "../src/IDREFHandler.mjs";
import TagHandler from "../src/TagHandler.mjs";

describe("ID-REF tag mixin", () => {

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

  it("simple-object", () => {

    class Tagger extends IDREFHandler(TagHandler) {
    }

    let other = { data: 'lorem ipsum' };
    let simple = {
      number: 10,
      string: 'String',
      _ignore: 'ignore',
      date: new Date(1234567890123),
      array: [ 1, 2, 3 ],
      ref1: other,
      ref2: other
    };

    const tagger = new Tagger();
    let frozen = Encoder.encode(simple, tagger);
    let thawed = Decoder.decode(frozen, tagger);
    assert(!thawed._ignore);
    assert.equal(thawed.number, simple.number);
    assert.equal(thawed.string, simple.string);
    assert.equal(thawed.date.toISOString(), simple.date.toISOString());
    assert.deepEqual(thawed.array, simple.array);
    assert.deepEqual(thawed.object, simple.object);
    assert.deepEqual(simple.classObject, thawed.classObject);
  });


  it("array", () => {

    class Tagger extends IDREFHandler(TagHandler) {
    }

    let frood = [ 1, 2, 3, 4];
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encodes(frood);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decodes();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(frood, thawed);
  });

  it("array-ref", () => {

    class Tagger extends IDREFHandler(TagHandler) {
    }

    let frood = [ 1, 2, 3, 4];
    let simple = {
      obj1: frood,
      obj2: frood
    };
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encodes(simple);
    let frozen = outs.Uint8Array;
    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decodes();
    //console.log(JSON.stringify(thawed));
    assert.deepEqual(thawed.obj1, thawed.obj2);
  });

  it("array-of", () => {

    class Tagger extends IDREFHandler(TagHandler) {
    }

    let frood = [ { 1: 2, 3: 4} ];
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encodes(frood);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decodes();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(frood, thawed);
  });

  it("two refs to same simple object", () => {

    class Tagger extends IDREFHandler(TagHandler) {
    }

    let frood = { 1: 2, 3: 4 };
    let simple = {
      obj1: frood,
      obj2: frood
    };
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encodes(simple);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decodes();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(thawed, simple);
    assert(thawed.obj1 === thawed.obj2);
  });

  it("two refs to same array", () => {

    class Tagger extends IDREFHandler(TagHandler) {
    }

    let frood = [ 1, 2, 3, 4 ];
    let simple = {
      obj1: frood,
      obj2: frood
    };
    assert(simple.obj1 === simple.obj2);
    const tagger = new Tagger();
    const outs = new MemoryOutStream();
    const encoder = new Encoder(outs, tagger);
    encoder.debug = console.debug;
    encoder.encodes(simple);
    const frozen = outs.Uint8Array;

    //console.log(frozen);
    const thawed = new Decoder(new MemoryInStream(frozen), tagger).decodes();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(thawed, simple);
    assert(thawed.obj1 === thawed.obj2);
  });

  it("self-referential", () => {

    let frood = {};
    frood.selfRef = frood;

    const tagger = new (IDREFHandler(TagHandler))();

    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encodes(frood);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    let thawed = decoder.decodes();

    //console.log(JSON.stringify(thawed));
    assert(thawed.selfRef === thawed);
  });
});
