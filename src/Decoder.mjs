/*
 * Based on cbor-js, Copyright (c) 2014-2016 Patrick Gansterer <paroga@paroga.com> and (c) 2021 Taisuke Fukuno <fukuno@jig.jp>
 * This version Copyright (C) 2022 Crawford Currie
 */

/**
 * CBOR specification is at https://www.rfc-editor.org/rfc/rfc8949.html
 */

/* global TypedArray */

import { TagHandler } from "./TagHandler.mjs";
import { MemoryInStream } from "./MemoryInStream.mjs";

/**
 * Decoder for objects encoded according to the CBOR specification.
 * A tagHandler object can be provided to handle extensions to basic
 * CBOR. Data is read from a DataInStream.
 */
class Decoder {

  /**
   * @param {DataInStream} stream stream to read from
   * @param {TagHandler?} tagHandler tag handling object, called on all objects
   */
  constructor(stream, tagHandler) {

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
    this.tagHandler = tagHandler || new TagHandler();
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
   * Analyse argument type.
   * {@see https://www.rfc-editor.org/rfc/rfc8949.html#name-specification-of-the-cbor-e}
   * @param {number} ai 5-bit additional information
   * @param {number} majorType the major type being read
   * @return the argument value. For major types 2, 3, 4, 5, 7, additional
   * info of 31 (0x1f) will return -1
   * @private
   */
  readArgument(ai, majorType) {
    if (ai < 24)
      return ai; // simple value 0..23
    switch (ai) {
    case 24:
      return this.stream.readUint8(); // 32..255 in following byte
    case 25: // IEEE 754 Half-Precision Float
      return this.stream.readUint16();
    case 26: // IEEE 754 Single-Precision Float
      return this.stream.readUint32();
    case 27: // IEEE 754 Double-Precision Float
      return this.stream.readUint64();
    case 31:
      switch (majorType) {
      case 0: case 1: case 6:
        break; // malformed
      default:
        return -1; // indefinite length, or break
      }
    }
    throw Error(`Malformed ${majorType} ${ai}`);
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
      if (ai === 0x1f)
        return -1; // "break"
      if (type !== majorType)
        throw Error(`Major type mismatch on chunk ${type}!=${majorType}`);
      const len = this.readArgument(ai, majorType);
      if (len < 0)
        throw Error(`Invalid chunk length ${len}`);
      return len;
    };
    const elements = [];
    let fullArrayLength = 0;
    let length;
    while ((length = readChunkLength()) >= 0) {
      if (this.debug) this.debug(`\tCHUNK ${length} bytes`);
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
    let ret = this.tagHandler.createArray(this);
    for (let i = 0; i < length; i++)
      ret.push(this.decodeItem());
    return ret;
  }

  /**
   * Read an indefinite length item array.
   * @private
   */
  readIndefiniteItemArray() {
    const ret = this.tagHandler.createArray(this);
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
    const retObject = this.tagHandler.createObject(this);
    for (let i = 0; i < length; i++) {
      let key = this.decodeItem();
      key = this.tagHandler.decodeKey(key, this);
      retObject[key] = this.decodeItem();
    }
    return retObject;
  }

  /**
   * Read a list of key-value pairs.
   * @private
   */
  readIndefiniteKV() {
    const retObject = this.tagHandler.createObject(this);
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
    let len, tag, thawed;

    switch (majorType) {

    case 0: // unsigned integer
      /* istanbul ignore if */
      if (this.debug) this.debug(`${this.stream.readPos}: UINT ${ai}`);
      return this.readArgument(ai, 0);

    case 1: // negative integer
      /* istanbul ignore if */
      if (this.debug) this.debug(`${this.stream.readPos}: -INT ${ai}`);
      return -1 - this.readArgument(ai, 1);

    case 2: // byte string
      /* istanbul ignore if */
      if (this.debug) this.debug(`${this.stream.readPos}: BYTES ${ai}`);
      if (ai === 31)
          return this.readIndefiniteBytes(majorType);
      len = this.readArgument(ai, 2);
      if (len < 0)
        throw Error(`Invalid byte string length ${len}`);     
      return this.stream.readUint8Array(len);

    case 3: // UTF-8 encoded text string
      /* istanbul ignore if */
      if (ai === 0x1f) {
        if (this.debug) this.debug(`${this.stream.readPos}: TEXT? ${ai}`);
        return new TextDecoder().decode(this.readIndefiniteBytes(majorType));
      }
      if (this.debug) this.debug(`${this.stream.readPos}: TEXT `);
      len = this.readArgument(ai, 3);
      if (len < 0)
        throw Error(`Invalid text length ${len}`);
      return new TextDecoder().decode(this.stream.readUint8Array(len));

    case 4: // array of data items
      if (ai === 0x1f) {
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.readPos}: ARRAY?`);
        return this.readIndefiniteItemArray();
      }
      len = this.readArgument(ai, 4);
      if (len < 0)
        throw Error("Invalid array length ${len}");
      /* istanbul ignore if */
      if (this.debug) this.debug(`${this.stream.readPos}: ARRAY ${len}`);
      return this.readItemArray(len);

    case 5: // map of pairs of data items
      if (ai === 0x1f) {
        /* istanbul ignore if */
        if (this.debug) this.debug(`${this.stream.readPos}: MAP?`);
        return this.readIndefiniteKV();
      }
      len = this.readArgument(ai, 5);
      if (len < 0)
        throw Error("Invalid map length ${len}");
      /* istanbul ignore if */
      if (this.debug) this.debug(`${this.stream.readPos}: MAP length ${len}`);
      return this.readKV(len);

    case 6: // tagged data item
      tag = this.readArgument(ai, 6);
      /* istanbul ignore if */
      if (this.debug) this.debug(`${this.stream.readPos}: TAG ${tag}`);

      thawed = this.tagHandler.decode(tag, this);
      if (typeof thawed !== "undefined")
        return thawed; // else drop through to read the next item

      switch (tag) { // predefined tags, no conversions by default
      case 0: // date/time string
      case 1: // numerical date
        return new Date(this.decodeItem());
      case 2: break; // unsigned bignum
      case 3: break; // negative bignum
      case 4: break; // decimal fraction
      case 5: break; // bigfloat
      case 21: break; // base64url
      case 22: break; // base64
      case 23: break; // base 16
      case 24: break; // encoded CBOR data item
      case 32: break; // URI
      case 33: break; // base64url
      case 34: break; // base64
      case 36: break; // MIME message
      case 55799: break; // self-described CBOR
      }       

      // Default to just decoding the following data
      return this.decodeItem();

    case 7: // floating point number and values with no content
      // https://www.rfc-editor.org/rfc/rfc8949.html#name-floating-point-numbers-and-
      /* istanbul ignore if */
      if (this.debug) this.debug(`${this.stream.readPos}: OTHER ${ai}`);
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
  decodes() {
    const ret = this.decodeItem();
    this.tagHandler.finishDecoding(this, ret);
    return ret;
  }

  /**
   * Decode a value from CBOR.
   * @param {TypedArray|ArrayBuffer|DataView} data data to decode
   * @param {TagHandler?} optional tag handler
   * @return {object} the decoded data
   */
  static decode(encoded, handler, debug) {
    const ins = new MemoryInStream(encoded);
    const decoder = new Decoder(ins, handler);
    decoder.debug = debug;
    return decoder.decodes();
  }
}

export { Decoder };

