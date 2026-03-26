/* eslint-env node, mocha, browser */

import MemoryInStream from "../src/MemoryInStream.js";
import MemoryOutStream from "../src/MemoryOutStream.js";
import Encoder from "../src/Encoder.js";
import Decoder from "../src/Decoder.js";
import TypeMapHandler from "../src/TypeMapHandler.js";
import KeyDictionaryHandler from "../src/KeyDictionaryHandler.js";
import IDREFHandler from "../src/IDREFHandler.js";
import TagHandler from "../src/TagHandler.js";

// Shows how to read and write CBOR data in node.js
describe("node.js only", () => {

  function UNit() {}

  let assert, Fs, Path, fileURLToPath, __dirname, untestable = true;

  before(() => {
    // Import will fail in the browser, that's OK, we'll just ignore it
    return import("chai")
    .then(chai => assert = chai.assert)
    .then(() => import("fs"))
    .then(mod => Fs = mod.promises)
    .then(() => import("path"))
    .then(mod => Path = mod)
    .then(() => import("url"))
    .then(mod => fileURLToPath = mod.fileURLToPath)
    .then(() => {
      __dirname = Path.dirname(fileURLToPath(import.meta.url));
      untestable = false;
    })
    .finally(() => {});
  });

  class TestObject {
    fieldOne = "original";
    aray = [1, 2, 3 ];
    fnord() { return "blah"; }
  }

  it("write-read simple", () => {
    if (untestable)
      return undefined;
    
    const handler = new (KeyDictionaryHandler(
      IDREFHandler(TypeMapHandler(TagHandler))));
    const to = new TestObject();
    const frozen = Encoder.encode(to, handler);
    return Fs.writeFile("new.data", frozen)
    .then(() => Fs.readFile("new.data"))
    .then(data => Decoder.decode(data.buffer, handler))
    .then(data => {
      assert.deepEqual(data, to);
    })
    .then(() => Fs.unlink("new.data"));
  });

  it("write-read current", () => {
    if (untestable)
      return undefined;

    class Class {
      name = "Class";
      array = [ 1, 2, 3 ]
    }

    class Harry extends Array {
      constructor() {
        super();
        this[0] = new Class();
        this[1] = this[0];
        this[2] = this;
        this[3] = [ this ];
      }
    }

    const handler = new (IDREFHandler(KeyDictionaryHandler(
      TypeMapHandler(TagHandler))));
    const harry = new Harry();
    const frozen = Encoder.encode(harry, handler);
    const fn = Path.resolve(__dirname, "2.0.0.data");
    return Fs.writeFile(fn, frozen)
    .then(() => Fs.readFile(fn))
    .then(data => Decoder.decode(data.buffer, handler))
    .then(data => {
      assert(Array.isArray(data));
      assert.deepEqual(data, harry);
      return Fs.unlink(fn);
    });
  });

  it("read 1.0.5", () => {
    if (untestable)
      return undefined;
    const handler = new (KeyDictionaryHandler(
      IDREFHandler(TypeMapHandler(TagHandler))))({
        skipMissingProtos: true
      });
    // 1.0.5.data was generated using the same handlers
    const fn = Path.resolve(__dirname, "1.0.5.data");
    return Fs.readFile(fn)
    .then(data => Decoder.decode(data.buffer, handler))
    .then(data => {
      assert(Array.isArray(data));
      // Make sure both array elements refer to the same Class
      data[0].extra = true;
      assert(data[1].extra);
      assert.equal(data[1].name,"Class");
    });
  });
});
