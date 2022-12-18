/* eslint-env node, mocha */

import { MemoryInStream } from "../src/MemoryInStream.js";
import { MemoryOutStream } from "../src/MemoryOutStream.js";
import { Encoder } from "../src/Encoder.js";
import { Decoder } from "../src/Decoder.js";
import { KeyDictionaryHandler } from "../src/KeyDictionaryHandler.js";
import { TagHandler } from "../src/TagHandler.js";

describe("KeyDictionary", () => {

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

  const A = {
    Aardvaark: "a", Budgerigar: "b", Crocodile: "c"
  };

  const ABC = {
    Aardvaark: A,
    Budgerigar: {
      Aardvaark: "A", Budgerigar: "B", Crocodile: "C"
    },
    Crocodile: {
      Aardvaark: "v",
      Budgerigar: "r",
      Crocodile:  [
        { Aardvaark: A },
        { Budgerigar: A },
        { Crocodile: A, Aardvaark: "A" }
      ]
    }
  };

  it("JSON", () => {
    const frozen = JSON.stringify(ABC);
    console.log("JSON", frozen.length);
    const thawed = JSON.parse(frozen);

    assert.deepEqual(thawed, ABC);
  });

  it("no tag handler", () => {
    const frozen = Encoder.encode(ABC);

    console.log("no tag handler", frozen.length);

    const thawed = Decoder.decode(frozen);

    assert.deepEqual(thawed, ABC);
  });

  it("no keys known", () => {
    const tagger = new (KeyDictionaryHandler(TagHandler))({
      //debug: console.debug
    });

    const frozen = Encoder.encode(ABC, tagger);

    console.log("no keys known", frozen.length);

    const thawed = Decoder.decode(frozen, tagger);

    assert.deepEqual(thawed, ABC);
  });

  it("some keys known", () => {
    const tagger = new (KeyDictionaryHandler(TagHandler))({
      keys: [ "Aardvaark", "Budgerigar" ]
    });

    const frozen = Encoder.encode(ABC, tagger);

    console.log("some keys known", frozen.length);

    const thawed = Decoder.decode(frozen, tagger);

    assert.deepEqual(thawed, ABC);
  });

  it("all keys known", () => {
    const tagger = new (KeyDictionaryHandler(TagHandler))({
      keys: [ "Aardvaark", "Budgerigar", "Crocodile" ]
    });

    const frozen = Encoder.encode(ABC, tagger);

    console.log("all keys known", frozen.length);

    const thawed = Decoder.decode(frozen, tagger);

    assert.deepEqual(thawed, ABC);
  });
});
