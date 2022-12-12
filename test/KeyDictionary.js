/* eslint-env node, mocha */

import Encoder from "../js/Encoder.mjs";
import Decoder from "../js/Decoder.mjs";
import MemoryInStream from "../js/MemoryInStream.mjs";
import MemoryOutStream from "../js/MemoryOutStream.mjs";
import KeyDictionary from "../js/KeyDictionaryMixin.mjs";
import TagHandler from "../js/TagHandler.mjs";
import { assert } from "chai";

describe("KeyDictionary", () => {

  function UNit() {}

  it("no key dictionary", () => {
    const tagger = new (KeyDictionary(TagHandler))();
    const data = {
      Aardvaark: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" },
      Budgerigar: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" },
      Crocodile: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" }
    };

    let outs = new MemoryOutStream();
    const encoder = new Encoder(outs, tagger);
    //encoder.debug = console.debug;
    encoder.encode(data);
    let frozen = outs.Uint8Array;

    console.log("Unknown keys", frozen.length);

    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    let thawed = decoder.decode();

    assert.deepEqual(thawed, data);
  });

  it("key dictionary, known keys, write", () => {
    let tagger = new (KeyDictionary(TagHandler))({
      keys: [ "Aardvaark", "Budgerigar", "Crocodile" ],
      writeKeyDict: true
    });
    const data = {
      Aardvaark: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" },
      Budgerigar: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" },
      Crocodile: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" }
    };

    let outs = new MemoryOutStream();
    const encoder = new Encoder(outs, tagger);
    //encoder.debug = console.debug;
    encoder.encode(data);
    let frozen = outs.Uint8Array;

    console.log("Known keys, write", frozen.length);

    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    let thawed = decoder.decode();

    assert.deepEqual(thawed, data);
  });

  it("key dictionary, known keys, no write", () => {
    const tagger = new (KeyDictionary(TagHandler))({
      keys: [ "A", "B", "C" ],
      writeKeyDict: false
    });
    const data = {
      Aardvaark: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" },
      Budgerigar: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" },
      Crocodile: { Aardvaark: "a", Budgerigar: "b", Crocodile: "c" }
    };

    const outs = new MemoryOutStream();
    const encoder = new Encoder(outs, tagger);
    //encoder.debug = console.debug;
    encoder.encode(data);
    const frozen = outs.Uint8Array;

    console.log("Known keys, no write", frozen.length);

    const decoder = new Decoder(new MemoryInStream(frozen), tagger);
    //decoder.debug = console.debug;
    const thawed = decoder.decode();

    assert.deepEqual(thawed, data);
  });
});
