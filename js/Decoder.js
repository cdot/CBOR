/*
 * Based on cbor-js, Copyright (c) 2014-2016 Patrick Gansterer <paroga@paroga.com> and (c) 2021 Taisuke Fukuno <fukuno@jig.jp>
 * This version Copyright (C) 2022 Crawford Currie
 */

/**
 * CBOR specification is at https://www.rfc-editor.org/rfc/rfc8949.html
 */

/* global TypedArray */

define([
  "js/TagHandler"
], (
  TagHandler
) => {
  
  /**
   * Decoder for objects encoded according to the CBOR specification.
   * A tagger object must be provded to handle extensions to basic
   * CBOR. Data is read from a DataInStream.
   */
  class Decoder {

    /**
     * @param {DataInStream} stream stream to read from
     * @param {TagHandler?} tagger tag handling object, called on all objects
     */
    constructor(stream, tagger) {

      /**
       * Stream being read from.
       * @member {DataInStream}
       * @private
       */
      this.stream = stream;

      /**
       * Tagger object.
       * @member {TagHandler}
       * @private
       */
      this.tagger = tagger || new TagHandler();
    }

    /**
     * Peek an array break.
     * @return {boolean} true if a break was seen and skipped.
     * @private
     */
    readBreak() {
      if (this.stream.peekUint8() !== 0xff)
        return false;
      this.stream.readUint8();
      return true;
    }

    /**
     * Major type 7; analyse argument
     * @param {number} ai 5-bit additional information
     * @private
     */
    readArgument(ai) {
      if (ai < 24)
        return ai; // simple value 0..23
      switch (ai) {
      case 24:
        return this.stream.readUint8(); // 32..255 in following byte
      case 25: // IEEE 754 Half-Precision Float (16 bits follow)
        return this.stream.readUint16();
      case 26: // IEEE 754 Single-Precision Float (32 bits follow)
        return this.stream.readUint32();
      case 27: // IEEE 754 Double-Precision Float (64 bits follow)
        return this.stream.readUint64();
      case 31:
        return -1; // "break" stop code
      }
      throw Error(`Invalid additional information ${ai}`);
    }

    /**
     * Read an indefinite length byte array.
     * @param {number} majorType major type of item, used for checking
     * @private
     */
    readIndefiniteBytes(majorType) {
      // series of zero or more strings of the specified type ("chunks")
      // that have definite lengths, and finished by the "break" stop code
      const readChunkLength = () => {
        const initialByte = this.stream.readUint8();
        const type = initialByte >> 5;
        const ai = initialByte & 0x1f;
        if (ai === 31)
          return -1; // "break"
        if (type !== majorType)
          throw Error("Major type mismatch on chunk");
        const len = this.readArgument(ai);
        /* istanbul ignore if */
        if (len < 0)
          throw Error(`Invalid chunk length ${len}`);
        return len;
      };
      const elements = [];
      let fullArrayLength = 0;
      let length;
      while ((length = readChunkLength()) >= 0) {
        fullArrayLength += length;
        elements.push(this.stream.readUint8Array(length));
      }
      const fullArray = new Uint8Array(fullArrayLength);
      let fullArrayOffset = 0;
      for (let i = 0; i < elements.length; i++) {
        fullArray.set(elements[i], fullArrayOffset);
        fullArrayOffset += elements[i].length;
      }
      return fullArray;
    }

    /**
     * Read an item array.
     * @private
     * @param {number} length length of the array
     */
    readItemArray(length) {
      let ret = this.tagger.createArray(this);
      for (let i = 0; i < length; i++)
        ret.push(this.decodeItem());
      return ret;
    }

    /**
     * Read an indefinite length item array.
     * @private
     */
    readIndefiniteItemArray() {
      const ret = this.tagger.createArray(this);
      while (!this.readBreak())
        ret.push(this.decodeItem());
      return ret;
    }

    /**
     * Read a list of key-value pairs into an object
     * @private
     * @param {number} length length of the list
     */
    readKV(length) {
      const retObject = this.tagger.createObject(this);
      for (let i = 0; i < length; i++) {
        let key = this.decodeItem();
        key = this.tagger.decodeKey(key, this);
        retObject[key] = this.decodeItem();
      }
      return retObject;
    }

    /**
     * Read a list of key-value pairs.
     * @private
     */
    readIndefiniteKV() {
      const retObject = this.tagger.createObject(this);
      while (!this.readBreak()) {
        const key = this.decodeItem();
        retObject[key] = this.decodeItem();
      }
      return retObject;
    }

    /**
     * Decode the next item on the input stream.
     * @private
     */
    decodeItem() {
      const initialByte = this.stream.readUint8();
      const majorType = initialByte >> 5;
      const ai = initialByte & 0x1f; // additional information
      let len, tag;

      switch (majorType) {

      case 0: // unsigned integer
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: UINT ${ai}`);
        if (ai === 31)
          throw Error("Invalid 0 AI");
        return this.readArgument(ai);

      case 1: // negative integer
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: -INT ${ai}`);
        /* istanbul ignore if */
        if (ai === 31)
          throw Error("Invalid 1 AI");
        return -1 - this.readArgument(ai);

      case 2: // byte string
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: BYTES ${ai}`);
        if (ai === 31)
          return this.readIndefiniteBytes(majorType);
        return this.stream.readUint8Array(this.readArgument(ai));

      case 3: // UTF-8 encoded text string
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: TEXT ${ai}`);
        if (ai === 31)
          return new TextDecoder().decode(this.readIndefiniteBytes(majorType));
        return new TextDecoder().decode(this.stream.readUint8Array(this.readArgument(ai)));

      case 4: // array of data items
        if (ai === 31) {
          /* istanbul ignore if */
          if (this.debug) this.debug(`${this.stream.writePos}: ARRAY?`);
          return this.readIndefiniteItemArray();
        }
        len = this.readArgument(ai);
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: ARRAY ${len}`);
        return this.readItemArray(len);

      case 5: // map of pairs of data items
        if (ai === 31) {
          /* istanbul ignore if */
          if (this.debug) this.debug(`${this.stream.writePos}: MAP?`);
          return this.readIndefiniteKV();
        }
        len = this.readArgument(ai);
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: MAP length ${len}`);
        return this.readKV(len);

      case 6: // tagged data item
        /* istanbul ignore if */
        if (ai === 31)
          throw Error("Invalid 6 AI");
        tag = this.readArgument(ai);
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: TAG ${tag}`);

        if (tag === 1) // numerical date
          return new Date(this.decodeItem());

        {
          const thaw = this.tagger.decode(tag, this);
          if (typeof thaw !== "undefined")
            return thaw; // else drop through to read the next item
        }
        return this.decodeItem();

      case 7: // floating point number and values with no content
        // https://www.rfc-editor.org/rfc/rfc8949.html#name-floating-point-numbers-and-
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.writePos}: OTHER ${ai}`);
        switch (ai) {
        case 20:
          return false;
        case 21:
          return true;
        case 22:
          return null;
        case 23:
          return undefined;
        case 24:
          return this.stream.readUint8();
        case 25:
          return this.stream.readFloat16();
        case 26:
          return this.stream.readFloat32();
        case 27:
          return this.stream.readFloat64();
        }
        return ai;
      }

      /* istanbul ignore next */
      throw Error(`Unrecognised major type ${majorType}`);
    }

    /**
     * Read and decode input from the stream.
     * @return {object} object decoded from the data
     */
    decode() {
      const ret = this.decodeItem();
      this.tagger.finishDecoding(this, ret);
      return ret;
    }
  }

  return Decoder;
});
