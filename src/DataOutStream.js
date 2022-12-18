/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

/**
 * Base class of output streams used by CBOR Encoder.
 * @interface
 */
class DataOutStream {

  /* istanbul ignore next */
  /**
   * Write an unsigned byte.
   * @param {number} value number to write
   */
  writeUint8(value) {
    throw Error("DataStream.writeUint8");
  }

  /* istanbul ignore next */
  /**
   * Write an unsigned short.
   * @param {number} value number to write
   */
  writeUint16(value) {
    throw Error("DataStream.writeUint16");
  }

  /* istanbul ignore next */
  /**
   * Write an unsigned int.
   * @param {number} value number to write
   */
  writeUint32(value) {
    throw Error("DataStream.writeUint32");
  }

  /* istanbul ignore next */
  /**
   * Write an unsigned long.
   * @param {number} value number to write
   */
  writeUint64(value) {
    throw Error("DataStream.writeUint64");
  }

  /* istanbul ignore next */
  /**
   * Write a float.
   * @param {number} value number to write
   */
  writeFloat32(value) {
    throw Error("DataStream.writeFloat32");
  }

  /* istanbul ignore next */
  /**
   * Write a long float.
   * @param {number} value number to write
   */
  writeFloat64(value) {
    throw Error("DataStream.writeFloat64");
  }

  /* istanbul ignore next */
  /**
   * Write an unsigned byte array.
   * @param {TypedArray} value byte array to write
   */
  writeUint8Array(value) {
    for (let i = 0; i < value.length; ++i)
      this.writeUint8(this.writePos++, value[i]);
  }
};

export { DataOutStream };

