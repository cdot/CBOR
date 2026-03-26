/* eslint-env node, mocha, browser */

import DataInStream from "../src/DataInStream.js";
import DataOutStream from "../src/DataOutStream.js";

describe("stream interfaces", () => {

  const dis = new DataInStream();
  const dos = new DataOutStream();

  it("readFloat16", () => {
    try {
      dis.readFloat16();
      assert(false);
    } catch(e) {
    }
  });

  it("readFloat32", () => {
    try {
      dis.readFloat32();
      assert(false);
    } catch(e) {
    }
  });

  it("readFloat64", () => {
    try {
      dis.readFloat64();
      assert(false);
    } catch(e) {
    }
  });

  it("readUint8", () => {
    try {
      dis.readUint8();
      assert(false);
    } catch(e) {
    }
  });

  it("readUint16", () => {
    try {
      dis.readUint16();
      assert(false);
    } catch(e) {
    }
  });

  it("readUint32", () => {
    try {
      dis.readUint32();
      assert(false);
    } catch(e) {
    }
  });

  it("readUint64", () => {
    try {
      dis.readUint64();
      assert(false);
    } catch(e) {
    }
  });

  it("readUint8Array", () => {
    try {
      dis.readUint8Array();
      assert(false);
    } catch(e) {
    }
  });

  it("peekUint8", () => {
    try {
      dis.peekUint8();
      assert(false);
    } catch(e) {
    }
  });

  it("get mark", () => {
    try {
      const m = dis.mark;
      assert(false);
    } catch(e) {
    }
  });

  it("set mark", () => {
    try {
      dis.mark = 99;
      assert(false);
    } catch(e) {
    }
  });

  it("exhausted", () => {
    try {
      dis.exhausted();
      assert(false);
    } catch(e) {
    }
  });

  it("writeUint8", () => {
    try {
      dos.writeUint8(0);
      assert(false);
    } catch (e) {
    }
  });

  it("writeUint16", () => {
    try {
      dos.writeUint16(0);
      assert(false);
    } catch (e) {
    }
  });

  it("writeUint32", () => {
    try {
      dos.writeUint32(0);
      assert(false);
    } catch (e) {
    }
  });

  it("writeUint64", () => {
    try {
      dos.writeUint64(0);
      assert(false);
    } catch (e) {
    }
  });

  it("writeFloat32", () => {
    try {
      dos.writeFloat32(0);
      assert(false);
    } catch (e) {
    }
  });

  it("writeFloat64", () => {
    try {
      dos.writeFloat64(0);
      assert(false);
    } catch (e) {
    }
  });

  it("writeUint8Array", () => {
    try {
      dos.writeUint8Array(0);
      assert(false);
    } catch (e) {
    }
  });
});
