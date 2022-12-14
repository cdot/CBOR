/* eslint-env node, mocha, browser */

import MemoryInStream from "../src/MemoryInStream.mjs";
import MemoryOutStream from "../src/MemoryOutStream.mjs";

describe("Memory streams", () => {

  function UNit() {}

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

  it("Uint8", () => {
    const MAX = 2 ** 8 - 1;
    const outs = new MemoryOutStream();
    outs.writeUint8(0);
    outs.writeUint8(MAX);
    const a = outs.Uint8Array;

    const ins = new MemoryInStream(a);
    assert.equal(ins.peekUint8(), 0);
    assert.equal(ins.readUint8(), 0);
    assert.equal(ins.peekUint8(), MAX);
    assert.equal(ins.readUint8(), MAX);
    assert.equal(ins.readPos, a.byteLength);
  });

  it("Uint16", () => {
    const MAX = 2 ** 16 - 1;
    const outs = new MemoryOutStream();
    outs.writeUint16(0);
    outs.writeUint16(MAX);
    const a = outs.Uint8Array;

    const ins = new MemoryInStream(a);
    assert.equal(ins.readUint16(), 0);
    assert.equal(ins.readUint16(), MAX);
    assert.equal(ins.readPos, a.byteLength);
  });

  it("Uint32", () => {
    const MAX = 2 ** 32 - 1;
    const outs = new MemoryOutStream();
    outs.writeUint32(0);
    outs.writeUint32(MAX);
    const a = outs.Uint8Array;

    const ins = new MemoryInStream(a);
    assert.equal(ins.readUint32(), 0);
    assert.equal(ins.readUint32(), MAX);
    assert.equal(ins.readPos, a.byteLength);
  });

  it("Uint64", () => {
    const MAX = Number.MAX_SAFE_INTEGER;
    const outs = new MemoryOutStream();
    outs.writeUint64(0);
    outs.writeUint64(MAX);
    const a = outs.Uint8Array;
    const ins = new MemoryInStream(a);
    assert.equal(ins.readUint64(), 0);
    assert.equal(ins.readUint64(), MAX);
    assert.equal(ins.readPos, a.byteLength);
  });

  // Float 16 is not supported.

  it("Float32", () => {
    const SMALL = 2 ** -126;
    const BIG = (2 - (2 ** -23)) * (2 ** 127);
    const outs = new MemoryOutStream();
    outs.writeFloat32(BIG);
    outs.writeFloat32(-BIG);
    outs.writeFloat32(SMALL);
    outs.writeFloat32(-SMALL);
    const a = outs.Uint8Array;
    const ins = new MemoryInStream(a);
    assert.equal(ins.readFloat32(), BIG);
    assert.equal(ins.readFloat32(), -BIG);
    assert.equal(ins.readFloat32(), SMALL);
    assert.equal(ins.readFloat32(), -SMALL);
    assert.equal(ins.readPos, a.byteLength);
  });

  it("Float64", () => {
    const MAX =  Number.MAX_VALUE;
    const MIN =  Number.EPSILON;
    const outs = new MemoryOutStream();
    outs.writeFloat64(MIN);
    outs.writeFloat64(MAX);
    const a = outs.Uint8Array;
    const ins = new MemoryInStream(a);
    assert.equal(ins.readFloat64(), MIN);
    assert.equal(ins.readFloat64(), MAX);
    assert.equal(ins.readPos, a.byteLength);
  });

  it("byte array", () => {
    const empty = new Uint8Array([]);
    const bytes = new Uint8Array([88, 79, 16, 54, 20, 255, 0 ]);
    const outs = new MemoryOutStream();
    outs.writeUint8Array(bytes);
    outs.writeUint8Array(empty);
    const a = outs.Uint8Array;
    const ins = new MemoryInStream(a);
    assert.deepEqual(ins.readUint8Array(bytes.byteLength), bytes);
    assert.deepEqual(ins.readUint8Array(empty.byteLength), empty);
  });
});
