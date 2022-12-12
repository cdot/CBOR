/**
 * A stream for use with CBOREncoder / CBORDecoder, works on a DataView
 */
import DataOutStream from "./DataOutStream.mjs";

const POW_2_32 = 2 ** 32;

/**
 * Impementation of DataOutStream for use with CBOR.
 * Writes to an ArrayBuffer.
 */
export default class MemoryOutStream extends DataOutStream {

  /**
   * DataView being written to.
   * @private
   * @member {MemoryStream}
   */
  view = new DataView(new ArrayBuffer(256));

  /**
   * Write offset into the DataView.
   * @private
   * @member {number}
   */
  writePos = 0;

  /**
   * Make space at the end of the buffer for the given number of bytes.
   * @param {number} bytes number of bytes to make space for
   * @private
   */
  appendSpaceFor(bytes) {
    const required = this.writePos + bytes;
    const curLen = this.view.buffer.byteLength;
    let newLen = curLen;
    while (newLen < required)
      newLen *= 2;
    if (newLen !== curLen) {
      const newBuffer = new ArrayBuffer(newLen);
      new Uint8Array(newBuffer).set(new Uint8Array(this.view.buffer));
      this.view = new DataView(newBuffer);
    }
  }

  /**
   * Make space at the start of the buffer for the given number of
   * bytes.
   * @param {number} bytes number of bytes to make space for
   * @private
   */
  prependSpaceFor(bytes) {
    const required = bytes + this.writePos;
    let buffer = this.view.buffer;
    if (buffer.byteLength < required)
      buffer = new ArrayBuffer(required);
    const wa = new Uint8Array(buffer);
    wa.set(new Uint8Array(this.view.buffer, 0, this.writePos), bytes);
    this.writePos += bytes;
    this.view = new DataView(buffer);
  }

  /**
   * Prepend a TypedArray to the start of the data.
   * @param {TypedArray} data data to prepend
   */
  prepend(data) {
    this.prependSpaceFor(data.byteLength);
    new Uint8Array(this.view.buffer).set(data, 0);
  }

  /**
   * Write a float.
   * @private
   * @param {number} value number to write
   */
  writeFloat32(value) {
    this.appendSpaceFor(4);
    this.view.setFloat32(this.writePos, value);
    this.writePos += 4;
  }

  /**
   * Write a long float.
   * @private
   * @param {number} value number to write
   */
  writeFloat64(value) {
    this.appendSpaceFor(8);
    this.view.setFloat64(this.writePos, value);
    this.writePos += 8;
  }

  /**
   * Write an unsigned byte.
   * @private
   * @param {number} value number to write
   */
  writeUint8(value) {
    this.appendSpaceFor(1);
    this.view.setUint8(this.writePos, value);
    this.writePos++;
  }

  /**
   * Write an unsigned byte array.
   * @private
   * @param {number} value byte array to write
   */
  writeUint8Array(value) {
    this.appendSpaceFor(value.length);
    for (let i = 0; i < value.length; ++i)
      this.view.setUint8(this.writePos++, value[i]);
  }

  /**
   * Write an unsigned short.
   * @private
   * @param {number} value number to write
   */
  writeUint16(value) {
    this.appendSpaceFor(2);
    this.view.setUint16(this.writePos, value);
    this.writePos += 2;
  }

  /**
   * Write an unsigned int.
   * @private
   * @param {number} value number to write
   */
  writeUint32(value) {
    this.appendSpaceFor(4);
    this.view.setUint32(this.writePos, value);
    this.writePos += 4;
  }

  /**
   * Write an unsigned long.
   * @private
   * @param {number} value number to write
   */
  writeUint64(value) {
    const low = value % POW_2_32;
    const high = (value - low) / POW_2_32;
    this.writeUint32(high);
    this.writeUint32(low);
  }

  /**
   * Like mark(), reset()
   */
  get mark() {
    return this.writePos;
  }

  /**
   * Like mark(), reset()
   */
  set mark(m) {
    this.writePos = m;
  }

  /**
   * Get the output buffer as a byte array.
   */
  get Uint8Array() {
    return new Uint8Array(this.view.buffer, 0, this.writePos);
  }
}

