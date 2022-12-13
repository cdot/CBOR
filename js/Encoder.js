/*
 * Based on cbor-js, Copyright (c) 2014-2016 Patrick Gansterer <paroga@paroga.com> and (c) 2021 Taisuke Fukuno <fukuno@jig.jp>
 * This version Copyright (C) 2022 Crawford Currie
 */

define([
  "js/DataOutStream", "js/TagHandler"
], (
  DataOutStream, TagHandler
) => {
  
  const POW_2_53 = 2 ** 53;

  /**
   * Binary encoder for Javascript objects, following the CBOR specification.
   * CBOR specification is at https://www.rfc-editor.org/rfc/rfc8949.html
   *
   * The encoded data is written to a {@linkcode DataOutStream}.
   */
  class Encoder {

    /**
     * @param {DataOutStream} stream where to write
     * @param {TagHandler} tagger tagger object, called on all objects
     */
    constructor(stream, tagger) {
      /**
       * DataOutStream being written to.
       * @private
       * @member {DataOutStream}
       */
      this.stream = stream;

      /**
       * Tag handler object.
       * @member {TagHandler}
       * @private
       */
      this.tagger = tagger || new TagHandler();
    }

    /**
     * Write a major type and the argument to that type.
     * For use by {@linkcode TagHandler} implementations only.
     * @private
     * @param {number} type CBOR major type
     * @param {number} argument to that type
     */
    writeTypeAndArgument(type, arg) {
      if (arg < 24) {
        this.stream.writeUint8((type << 5) | arg);
      } else if (arg < 0x100) {
        this.stream.writeUint8((type << 5) | 24);
        this.stream.writeUint8(arg);
      } else if (arg < 0x10000) {
        this.stream.writeUint8((type << 5) | 25);
        this.stream.writeUint16(arg);
      } else if (arg < 0x100000000) {
        this.stream.writeUint8((type << 5) | 26);
        this.stream.writeUint32(arg);
      } else {
        this.stream.writeUint8((type << 5) | 27);
        this.stream.writeUint64(arg);
      }
    }

    /**
     * Write a tag. Data associated with the tag can be
     * written following it using `encodeItem()`
     * For use by {@linkcode TagHandler} implementations only.
     * @private
     * @param {number} id tag to write
     */
    writeTag(id) {
      this.writeTypeAndArgument(6, id);
    }

    /**
     * Write a Javascript object of any type.
     * For use by {@linkcode TagHandler} implementations only.
     * @private
     * @param {number} id tag to write
     */
    encodeItem(value) {

      if (value === false) {
        // CBOR Appendix B Jump Table - false
        this.stream.writeUint8((7 << 5) | 20);
        return;
      }

      if (value === true) {
        // CBOR Appendix B Jump Table - true
        this.stream.writeUint8((7 << 5) | 21);
        return;
      }

      if (value === null) {
        // CBOR Appendix B Jump Table - null
        this.stream.writeUint8((7 << 5) | 22);
        return;
      }

      if (value === undefined) {
        // CBOR Appendix B Jump Table - undefined
        this.stream.writeUint8((7 << 5) | 23);
        return;
      }

      switch (typeof value) {

      case "number":
        if (Math.floor(value) === value) {
          if (0 <= value && value <= POW_2_53) {
            // CBOR major type 0 - unsigned integer 0..2^64-1
            this.writeTypeAndArgument(0, value);
            return;
          }

          if (-POW_2_53 <= value && value < 0) {
            // CBOR major type 1 - negative integer -2^64..-1
            this.writeTypeAndArgument(1, -(value + 1));
            return;
          }
          // bigints handled as floats
        }

        // Note: this is Javascript, all floats are double-precision.
        // CBOR Appendix B Jump Table - double-precision float
        this.stream.writeUint8((7 << 5) | 27);
        this.stream.writeFloat64(value);
        return;

      case "string":
        // CBOR major type 3 - text string encoded as UTF8
        {
          const utf8data = new TextEncoder().encode(value);
          this.writeTypeAndArgument(3, utf8data.length);
          this.stream.writeUint8Array(utf8data);
        }
        return;

        /* istanbul ignore next */
      case "function":
        throw Error("Can't CBOR function");
      }

      if (value instanceof Date) {
        // Encode dates as numbers
        this.writeTag(1);
        this.encodeItem(value.getTime());
        return;
      }

      // See if the TagHandler wants to tag the object. If it
      // returns undefined, it means enough have been done to encode
      // the object; otherwise will have to fall through to encode it
      // "the hard way".
      value = this.tagger.encode(value, this);
      if (typeof value === "undefined")
        return; // no more needs to be written

      if (Array.isArray(value)) {
        // CBOR major type 4 - array of data items
        this.writeTypeAndArgument(4, value.length);
        for (let i = 0; i < value.length; ++i)
          this.encodeItem(value[i]);
        return;
      }

      if (value instanceof Uint8Array) {
        // CBOR major type 2 - byte string
        this.writeTypeAndArgument(2, value.length);
        this.stream.writeUint8Array(value);
        return;
      }

      // Filter keys the tagger wants to skip
      const keys = Object.keys(value)
            .filter(k => typeof this.tagger.encodeKey(k, this) !== "undefined");

      const length = keys.length;
      // CBOR major type 5 - map of pairs of data items
      this.writeTypeAndArgument(5, length);
      for (const key of keys) {
        this.encodeItem(this.tagger.encodeKey(key, this));
        this.encodeItem(value[key]);
      }
    }

    /**
     * Encode a value as a Uint8Array. This is the main entry point to the
     * encoder.
     * @param {object} value value to encode
     */
    encode(value) {
      this.tagger.startEncoding(this);
      this.encodeItem(value);
      this.tagger.finishEncoding(this);
    }
  }

  return Encoder;
});
