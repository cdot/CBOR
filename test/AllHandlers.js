/* eslint-env node, mocha */

import { assert} from "chai";
import MemoryInStream from "../src/MemoryInStream.mjs";
import MemoryOutStream from "../src/MemoryOutStream.mjs";
import Encoder from "../src/Encoder.mjs";
import Decoder from "../src/Decoder.mjs";
import TypeMapHandler from "../src/TypeMapHandler.mjs";
import KeyDictionaryHandler from "../src/KeyDictionaryHandler.mjs";
import IDREFHandler from "../src/IDREFHandler.mjs";
import TagHandler from "../src/TagHandler.mjs";

describe("All handlers", () => {

  function UNit() {}

  class Wibble {
    strap = "original";
    strop() { return "blah"; }
  }

  function makeTagger(A, B, C) {
    const tagger = new (A(B(C(TagHandler))))({
      typeMap: {
        Wibble: Wibble
      },
      keys: [ "Budgerigar" ],
      writeKeyDict: true
    });

    // TypeMap
    {
      const frood = new Wibble('frood1');
      frood.strap = "modified";
      const simple = {
        obj1: frood,
        obj2: frood,
        obj3: new Wibble('not frood')
      };

      const frozen = Encoder.encode(simple, tagger);
      const thawed = Decoder.decode(frozen, tagger);

      assert(thawed.obj1 instanceof Wibble);
      assert(thawed.obj2 instanceof Wibble);
      assert(thawed.obj3 instanceof Wibble);
      assert.deepEqual(thawed, simple);
    }

    // KeyDictionary
    {
      const ABC = {
        Aardvaark: "a", Budgerigar: "b", Crocodile: "c"
      };
      const frozen = Encoder.encode(ABC, tagger);
      const thawed = Decoder.decode(frozen, tagger);
      assert.deepEqual(thawed, ABC);
    }

    // IDREF
    {
      const fnah = {
        fnah: 99
      };
      const frood = {
        blah: "blah",
        fnah1: fnah,
        fnah2: fnah
      };
      frood.selfRef = frood;

      const frozen = Encoder.encode(frood, tagger);
      const thawed = Decoder.decode(frozen, tagger);

      assert.strictEqual(thawed.selfRef, thawed);
      assert.strictEqual(thawed.fnah1, thawed.fnah2);
      thawed.fnah1.fnah = "fnah";
      assert.equal(thawed.fnah1.fnah, thawed.fnah2.fnah);
      assert.equal(thawed.blah, "blah");
    }
  }

  it("KeyDictionaryHandler, IDREFHandler, TypeMapHandler", () => {
    makeTagger(KeyDictionaryHandler, IDREFHandler, TypeMapHandler);
  });

  it("IDREFHandler, KeyDictionaryHandler, TypeMapHandler", () => {
    makeTagger(IDREFHandler, KeyDictionaryHandler, TypeMapHandler);
  });
  
  it("IDREFHandler, TypeMapHandler, KeyDictionaryHandler", () => {
    makeTagger(IDREFHandler, TypeMapHandler, KeyDictionaryHandler);
  });
});
         
