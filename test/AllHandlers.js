/* eslint-env node, mocha, browser */

import MemoryInStream from "../src/MemoryInStream.js";
import MemoryOutStream from "../src/MemoryOutStream.js";
import Encoder from "../src/Encoder.js";
import Decoder from "../src/Decoder.js";
import TypeMapHandler from "../src/TypeMapHandler.js";
import KeyDictionaryHandler from "../src/KeyDictionaryHandler.js";
import IDREFHandler from "../src/IDREFHandler.js";
import TagHandler from "../src/TagHandler.js";

describe("All handlers", () => {

  function UNit() {}

  class TestObject {
    fieldOne = "original";
    fnord() { return "blah"; }
  }

  let assert;

  // This clumsiness is because we want to run these tests in the browser,
  // which can't resolve node_modules/
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

  function makeTagger(...args) {
    let tc = TagHandler;
    if (args[2]) tc = args[2](tc);
    if (args[1]) tc = args[1](tc);
    if (args[0]) tc = args[0](tc);

    const tagger = new tc({
      typeMap: {
        TestObject: TestObject
      },
      keys: [ "Budgerigar" ],
      writeKeyDict: true
    });

    // TypeMap
    {
      const simpleObj = new TestObject('frood1');
      simpleObj.fieldOne = "modified";
      const simple = new TestObject();
      simple.obj1 = simpleObj;
      simple.obj2 = simpleObj;
      simple.obj3 = new TestObject('not frood');

      const frozen = Encoder.encode(simple, tagger);
      const thawed = Decoder.decode(frozen, tagger);

      assert(thawed instanceof TestObject);
      assert(thawed.obj1 instanceof TestObject);
      assert(thawed.obj2 instanceof TestObject);
      assert(thawed.obj3 instanceof TestObject);
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

    if (IDREFHandler in args) {
      // IDREF is required for self-referential loops and
      // shared object references
      const fnah = {
        fnah: 99
      };
      const freeze = {
        blah: "blah",
        fnah1: fnah,
        fnah2: fnah
      };
      freeze.selfRef = freeze;

      const frozen = Encoder.encode(freeze, tagger);
      const thawed = Decoder.decode(frozen, tagger);

      assert.strictEqual(thawed.selfRef, thawed);
      assert.strictEqual(thawed.fnah1, thawed.fnah2);
      thawed.fnah1.fnah = "fnah";
      assert.equal(thawed.fnah1.fnah, thawed.fnah2.fnah);
      assert.equal(thawed.blah, "blah");
    }
  }

  it("KeyDictionaryHandler+IDREFHandler+TypeMapHandler", () => {
    makeTagger(KeyDictionaryHandler, IDREFHandler, TypeMapHandler);
  });

  it("KeyDictionaryHandler+TypeMapHandler", () => {
    makeTagger(KeyDictionaryHandler, TypeMapHandler);
  });

  it("IDREFHandler+KeyDictionaryHandler+TypeMapHandler", () => {
    makeTagger(IDREFHandler, KeyDictionaryHandler, TypeMapHandler);
  });
  
  it("IDREFHandler+TypeMapHandler+KeyDictionaryHandler", () => {
    makeTagger(IDREFHandler, TypeMapHandler, KeyDictionaryHandler);
  });

  it("IDREFHandler+TypeMapHandler", () => {
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

    const tagger = new (KeyDictionaryHandler(
      IDREFHandler(TypeMapHandler(TagHandler))))({
        added: k => { throw Error(k) },
        keys: [ "Aardvaark", "Budgerigar", "Crocodile" ]
      });

    const frozen = Encoder.encode(ABC, tagger);
    const thawed = Decoder.decode(frozen, tagger);
    assert.deepEqual(thawed, ABC);
  });
});
         
