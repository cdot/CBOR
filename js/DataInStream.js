/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

define(() => {
  const POW_2_24 = 5.960464477539063e-8;
  const POW_2_32 = 2 ** 32;

  /**
   * Base class of data streams for use with CBOR.
   * @interface
   */
  class DataInStream {

    /* istanbul ignore next */
    /**
     * Read a short float.
     * @return {number} the data read
     */
    readFloat16() {
      throw Error("DataInStream.readFloat16");
    }

    /* istanbul ignore next */
    /**
     * Read a float.
     * @return {number} the data read
     */
    readFloat32() {
      throw Error("DataInStream.readFloat32");
    }

    /* istanbul ignore next */
    /**
     * Read a long float.
     * @return {number} the data read
     */
    readFloat64() {
      throw Error("DataInStream.readFloat64");
    }

    /* istanbul ignore next */
    /**
     * Read an unsigned byte.
     * @return {number} the data read
     */
    readUint8() {
      throw Error("DataInStream.readUint8");
    }

    /* istanbul ignore next */
    /**
     * Read an unsigned short.
     * @return {number} the data read
     */
    readUint16() {
      throw Error("DataInStream.readUint16");
    }

    /* istanbul ignore next */
    /**
     * Read an unsigned int.
     * @return {number} the data read
     */
    readUint32() {
      throw Error("DataInStream.readUint32");
    }

    /* istanbul ignore next */
    /**
     * Read an unsigned long.
     * @return {number} the data read
     */
    readUint64() {
    }

    /* istanbul ignore next */
    /**
     * Read a known number of bytes.
     
     * @param {number} length number of bytes to read
     * @return {Uint8Array} the data read
     */
    readUint8Array(length) {
      throw Error("DataInStream.readUint8Array");
    }

    /* istanbul ignore next */
    /**
     * Peek at the next byte on the input stream.
     * @return {Uint8} the next byte, without reading it
     */
    peekUint8() {
      throw Error("DataInStream.peekUint8");
    }

    /* istanbul ignore next */
    /**
     * Like mark(), reset()
     */
    get mark() {
      throw Error("DataInStream.get mark");
    }

    /* istanbul ignore next */
    /**
     * Like mark(), reset()
     */
    set mark(m) {
      throw Error("DataInStream.set mark");
    }
  };

  return DataInStream;
});
