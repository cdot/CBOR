/**
 * A stream for use with CBOREncoder / CBORDecoder, works on a DataView
 */
import { DataOutStream } from "./DataOutStream.mjs";

const POW_2_32 = 2 ** 32;

/**
 * Impementation of DataOutStream for use with CBOR.
 * Writes to an ArrayBuffer.
 * @implements DataOutStream
 */
class MemoryOutStream extends DataOutStream {

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
   * @override
   */
  writeUint8(value) {
    this.appendSpaceFor(1);
    this.view.setUint8(this.writePos, value);
    this.writePos++;
  }

  /**
   * @override
   */
  writeUint16(value) {
    this.appendSpaceFor(2);
    this.view.setUint16(this.writePos, value);
    this.writePos += 2;
  }

  /**
   * @override
   */
  writeUint32(value) {
    this.appendSpaceFor(4);
    this.view.setUint32(this.writePos, value);
    this.writePos += 4;
  }

  /**
   * @override
   */
  writeUint64(value) {
    const low = value % POW_2_32;
    const high = (value - low) / POW_2_32;
    this.writeUint32(high);
    this.writeUint32(low);
  }

  //writeFloat16(value) is not supported

  /**
   * @override
   */
  writeFloat32(value) {
    this.appendSpaceFor(4);
    // Javascript uses IEEE 754, same as CBOR (unsurprisingly)
    this.view.setFloat32(this.writePos, value);
    this.writePos += 4;
  }

  /**
   * @override
   */
  writeFloat64(value) {
    this.appendSpaceFor(8);
    // Javascript uses IEEE 754, same as CBOR (unsurprisingly)
    this.view.setFloat64(this.writePos, value);
    this.writePos += 8;
  }

  /**
   * @override
   */
  writeUint8Array(value) {
    this.appendSpaceFor(value.length);
    for (let i = 0; i < value.length; ++i)
      this.view.setUint8(this.writePos++, value[i]);
  }

  /**
   * @override
   */
  get Uint8Array() {
    return new Uint8Array(this.view.buffer, 0, this.writePos);
  }
}

export { MemoryOutStream };

