/* eslint-env node, mocha */

import MemoryInStream from "../src/MemoryInStream.mjs";
import MemoryOutStream from "../src/MemoryOutStream.mjs";
import Encoder from "../src/Encoder.mjs";
import Decoder from "../src/Decoder.mjs";
import KeyDictionaryHandler from "../src/KeyDictionaryHandler.mjs";
import TagHandler from "../src/TagHandler.mjs";

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
        { Crocodile: A }
      ]
    }
    };

  it("JSON", () => {
    const frozen = JSON.stringify(ABC);
    console.log("JSON", frozen.length);
    const thawed = JSON.parse(frozen);

    assert.deepEqual(thawed, ABC);
  });

  it("no key dictionary", () => {
    const tagger = new (KeyDictionaryHandler(TagHandler))();

    const frozen = Encoder.encode(ABC, tagger);

    console.log("Unknown keys", frozen.length);

    const thawed = Decoder.decode(frozen, tagger);

    assert.deepEqual(thawed, ABC);
  });

  it("key dictionary, known keys, write", () => {
    const tagger = new (KeyDictionaryHandler(TagHandler))({
      keys: [ "Aardvaark", "Budgerigar", "Crocodile" ],
      writeKeyDict: true
    });

    const frozen = Encoder.encode(ABC, tagger);

    console.log("Known keys, write", frozen.length);

    const thawed = Decoder.decode(frozen, tagger);

    assert.deepEqual(thawed, ABC);
  });

  it("key dictionary, known keys, no write", () => {
    const tagger = new (KeyDictionaryHandler(TagHandler))({
      keys: [ "A", "B", "C" ],
      writeKeyDict: false
    });

    const frozen = Encoder.encode(ABC, tagger);

    console.log("Known keys, no write", frozen.length);

    const thawed = Decoder.decode(frozen, tagger);

    assert.deepEqual(thawed, ABC);
  });
});
