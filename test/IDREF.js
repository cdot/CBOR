/* eslint-env node, mocha */

import Encoder from "../js/Encoder.mjs";
import Decoder from "../js/Decoder.mjs";
import MemoryInStream from "../js/MemoryInStream.mjs";
import MemoryOutStream from "../js/MemoryOutStream.mjs";
import IDREFMixin from "../js/IDREFMixin.mjs";
import TagHandler from "../js/TagHandler.mjs";
import { assert } from "chai";

describe("IDREF", () => {

  function UNit() {}

  it("simple-object", () => {

    class Tagger extends IDREFMixin(TagHandler) {
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
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encode(simple);
    let frozen = outs.Uint8Array;

    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decode();
    assert(!thawed._ignore);
    assert.equal(thawed.number, simple.number);
    assert.equal(thawed.string, simple.string);
    assert.equal(thawed.date.toISOString(), simple.date.toISOString());
    assert.deepEqual(thawed.array, simple.array);
    assert.deepEqual(thawed.object, simple.object);
    assert.deepEqual(simple.classObject, thawed.classObject);
  });


  it("array", () => {

    class Tagger extends IDREFMixin(TagHandler) {
    }

    let frood = [ 1, 2, 3, 4];
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encode(frood);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decode();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(frood, thawed);
  });

  it("array-ref", () => {

    class Tagger extends IDREFMixin(TagHandler) {
    }

    let frood = [ 1, 2, 3, 4];
    let simple = {
      obj1: frood,
      obj2: frood
    };
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encode(simple);
    let frozen = outs.Uint8Array;
    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decode();
    //console.log(JSON.stringify(thawed));
    assert.deepEqual(thawed.obj1, thawed.obj2);
  });

  it("array-of", () => {

    class Tagger extends IDREFMixin(TagHandler) {
    }

    let frood = [ { 1: 2, 3: 4} ];
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encode(frood);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decode();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(frood, thawed);
  });

  it("two refs to same simple object", () => {

    class Tagger extends IDREFMixin(TagHandler) {
    }

    let frood = { 1: 2, 3: 4 };
    let simple = {
      obj1: frood,
      obj2: frood
    };
    const tagger = new Tagger();
    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encode(simple);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    let thawed = new Decoder(new MemoryInStream(frozen), tagger).decode();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(thawed, simple);
    assert(thawed.obj1 === thawed.obj2);
  });

  it("two refs to same array", () => {

    class Tagger extends IDREFMixin(TagHandler) {
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
    encoder.encode(simple);
    const frozen = outs.Uint8Array;

    //console.log(frozen);
    const thawed = new Decoder(new MemoryInStream(frozen), tagger).decode();

    //console.log(JSON.stringify(thawed));
    assert.deepEqual(thawed, simple);
    assert(thawed.obj1 === thawed.obj2);
  });

  it("self-referential", () => {

    let frood = {};
    frood.selfRef = frood;

    const tagger = new (IDREFMixin(TagHandler))();

    let outs = new MemoryOutStream();
    new Encoder(outs, tagger).encode(frood);
    let frozen = outs.Uint8Array;

    //console.log(frozen);
    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    let thawed = decoder.decode();

    //console.log(JSON.stringify(thawed));
    assert(thawed.selfRef === thawed);
  });
});
