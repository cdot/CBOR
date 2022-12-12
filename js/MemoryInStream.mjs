/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

import DataInStream from "./DataInStream.mjs";

const POW_2_24 = 5.960464477539063e-8;
const POW_2_32 = 2 ** 32;

/**
 * Impementation of DataInStream for use with CBOR.
 * Reads from a Uin88Array.
 */
export default class MemoryInStream extends DataInStream {
  /**
   * DataView being read from.
   * @private
   * @member {DataView}
   */
  view = undefined;

  /**
   * Read offset into the DataView.
   * @private
   * @member {number}
   */
  readPos = 0;

  constructor(data) {
    super();

    if (data instanceof DataView)
      this.view = data;

    else if (data instanceof ArrayBuffer)
      this.view = new DataView(data, 0, data.length);

    else {
      // TypedArray, but node.js doesn't define it so can't use instanceof
      if (!(data.buffer
            && typeof data.byteLength === "number"
            && typeof data.byteOffset == "number"))
        throw Error("MemoryInStream: data unusable");

      this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }
  }

  /**
   * Read a short float.
   * @return {number} the data read
   * @private
   */
  readFloat16() {
    const tempArrayBuffer = new ArrayBuffer(4);
    const tempDataView = new DataView(tempArrayBuffer);
    const value = this.readUint16();

    const sign = value & 0x8000;
    let exponent = value & 0x7c00;
    const fraction = value & 0x03ff;

    if (exponent === 0x7c00)
      exponent = 0xff << 10;
    else if (exponent !== 0)
      exponent += (127 - 15) << 10;
    else if (fraction !== 0)
      return (sign ? -1 : 1) * fraction * POW_2_24;

    tempDataView.setUint32(0, sign << 16 | exponent << 13 | fraction << 13);
    return tempDataView.getFloat32(0);
  }

  /**
   * Read a float.
   * @return {number} the data read
   * @private
   */
  readFloat32() {
    const val = this.view.getFloat32(this.readPos);
    this.readPos += 4;
    return val;
  }

  /**
   * Read a long float.
   * @return {number} the data read
   * @private
   */
  readFloat64() {
    const val = this.view.getFloat64(this.readPos);
    this.readPos += 8;
    return val;
  }

  /**
   * Read an unsigned byte.
   * @return {number} the data read
   * @private
   */
  readUint8() {
    const val = this.view.getUint8(this.readPos);
    this.readPos += 1;
    return val;
  }

  /**
   * Read an unsigned short.
   * @return {number} the data read
   * @private
   */
  readUint16() {
    const val = this.view.getUint16(this.readPos);
    this.readPos += 2;
    return val;
  }

  /**
   * Read an unsigned int.
   * @return {number} the data read
   * @private
   */
  readUint32() {
    const val = this.view.getUint32(this.readPos);
    this.readPos += 4;
    return val;
  }

  /**
   * Read an unsigned long.
   * @return {number} the data read
   * @private
   */
  readUint64() {
    return this.readUint32() * POW_2_32 + this.readUint32();
  }
  /**
   * Read a known number of bytes.
   * @param {number} length number of bytes to read
   * @return {Uint8Array} the data read
   */
  readBytes(length) {
    const val = new Uint8Array(
      this.view.buffer, this.view.byteOffset + this.readPos, length);
    this.readPos += length;
    return val;
  }

  peekUint8() {
    return this.view.getUint8(this.readPos);
  }

  /**
   * Like mark(), reset()
   */
  get mark() {
    return this.readPos;
  }

  /**
   * Like mark(), reset()
   */
  set mark(m) {
    this.readPos = m;
  }
}

