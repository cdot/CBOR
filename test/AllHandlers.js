/* eslint-env node, mocha, browser */

import {
  Encoder, Decoder,
  TypeMapHandler, KeyDictionaryHandler, IDREFHandler, TagHandler
} from "../src/CBOR.js";

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
        added: k => { throw new Error(k); },
        keys: [ "Aardvaark", "Budgerigar", "Crocodile" ]
      });

    const frozen = Encoder.encode(ABC, tagger);
    const thawed = Decoder.decode(frozen, tagger);
    assert.deepEqual(thawed, ABC);
  });

  it("handles array self reference", () => {
    class Class {
      name = "Class";
      array = [ 1, 2, 3 ];
      constructor(thing) {
        this.thing = thing;
      }
    }

    class Harry extends Array {
      constructor() {
        super();
        this[0] = new Class(this);
        this[1] = this[0];
        this[2] = this;
        this[3] = [ this ];
      }
    }

    const handler = new (IDREFHandler(KeyDictionaryHandler(
      TypeMapHandler(TagHandler))))({
        typeMap: { Class: Class }
      });

    const harry = new Harry();
    const frozen = Encoder.encode(harry, handler);
    const thawed = Decoder.decode(frozen, handler);

    assert(Array.isArray(thawed));
    assert(thawed[0] instanceof Class);
    assert(thawed[0].thing === thawed);
    
    // Make sure both array elements refer to the same object
    thawed[0].extra = true;
    assert(thawed[1].extra);

    assert(thawed[2] === thawed);

    assert(thawed[3][0] === thawed);
  });
});
         
