/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

const POW_2_24 = 5.960464477539063e-8;
const POW_2_32 = 2 ** 32;

/**
 * Base class of data streams for use with CBOR.
 */
export default class DataInStream {

  /**
   * Read a short float.
   * @return {number} the data read
   */
  readFloat16() {
    throw Error("DataInStream.readFloat16");
  }

  /**
   * Read a float.
   * @return {number} the data read
   */
  readFloat32() {
    throw Error("DataInStream.readFloat32");
  }

  /**
   * Read a long float.
   * @return {number} the data read
   */
  readFloat64() {
    throw Error("DataInStream.readFloat64");
  }

  /**
   * Read an unsigned byte.
   * @return {number} the data read
   */
  readUint8() {
    throw Error("DataInStream.readUint8");
  }

  /**
   * Read an unsigned short.
   * @return {number} the data read
   */
  readUint16() {
    throw Error("DataInStream.readUint16");
  }

  /**
   * Read an unsigned int.
   * @return {number} the data read
   */
  readUint32() {
    throw Error("DataInStream.readUint32");
  }

  /**
   * Read an unsigned long.
   * @return {number} the data read
   */
  readUint64() {
  }

  /**
   * Read a known number of bytes.
   * @param {number} length number of bytes to read
   * @return {Uint8Array} the data read
   */
  readBytes(length) {
    throw Error("DataInStream.readBytes");
  }

  peekUint8() {
    throw Error("DataInStream.peekUint8");
  }

  /**
   * Like mark(), reset()
   */
  get mark() {
    throw Error("DataInStream.get mark");
  }

  /**
   * Like mark(), reset()
   */
  set mark(m) {
    throw Error("DataInStream.set mark");
  }
}


