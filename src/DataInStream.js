/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

/**
 * Base class of data streams for use with CBOR.
 * @interface
 */
class DataInStream {

  /**
   * Read a short float.
   * @return {number} the data read
   */
  readFloat16() {
    throw new Error("DataInStream.readFloat16");
  }

  /**
   * Read a float.
   * @return {number} the data read
   */
  readFloat32() {
    throw new Error("DataInStream.readFloat32");
  }

  /**
   * Read a long float.
   * @return {number} the data read
   */
  readFloat64() {
    throw new Error("DataInStream.readFloat64");
  }

  /**
   * Read an unsigned byte.
   * @return {number} the data read
   */
  readUint8() {
    throw new Error("DataInStream.readUint8");
  }

  /**
   * Read an unsigned short.
   * @return {number} the data read
   */
  readUint16() {
    throw new Error("DataInStream.readUint16");
  }

  /**
   * Read an unsigned int.
   * @return {number} the data read
   */
  readUint32() {
    throw new Error("DataInStream.readUint32");
  }

  /**
   * Read an unsigned long.
   * @return {number} the data read
   */
  readUint64() {
    throw new Error("DataInStream.readUint64");
  }

  /**
   * Read a known number of bytes.
   * @param {number} length number of bytes to read
   * @return {Uint8Array} the data read
   */
  readUint8Array(length) {
    throw new Error(`DataInStream.readUint8Array(${length})`);
  }

  /**
   * Peek at the next byte on the input stream.
   * @return {Uint8} the next byte, without reading it
   */
  peekUint8() {
    throw new Error("DataInStream.peekUint8");
  }

  /**
   * Like mark(), reset()
   */
  get mark() {
    throw new Error("DataInStream.get mark");
  }

  /**
   * Like mark(), reset()
   */
  set mark(m) {
    throw new Error("DataInStream.set mark");
  }

  /**
   * True if the stream is exhausted (all read)
   * @return {boolean} true if the stream is exhausted
   */
  exhausted() {
    throw new Error("DataInStream.exhausted");
  }
}

export default DataInStream;
