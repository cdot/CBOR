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
describe("All handlers", () => {

  function UNit() {}

  let assert, Fs;

  before(() => {
    // Import will fail inthe browser, that's OK, we'll just ignore it
    return import("chai")
    .then(chai => assert = chai.assert)
    .then(() => import("fs"))
    .then(mod => Fs = mod.promises)
    .finally(() => {});
  });

  class TestObject {
    fieldOne = "original";
    aray = [1, 2, 3 ];
    fnord() { return "blah"; }
  }

  it("node.js only - write and read", () => {
    if (!Fs)
      return undefined;
    const handler = new (KeyDictionaryHandler(
      IDREFHandler(TypeMapHandler(TagHandler))));
    const to = new TestObject();
    const frozen = Encoder.encode(to, handler);
    return Fs.writeFile("blah", frozen)
    .then(() => Fs.readFile("blah"))
    .then(data => Decoder.decode(data.buffer, handler))
    .then(data => {
      assert.deepEqual(data, to);
    })
    .then(() => Fs.unlink("blah"));
  });
});
