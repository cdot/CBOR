/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

define(() => {
  // "Hidden" field added to objects that have been serialised
  const IB_ID = "_\u00CD";

  // Private CBOR tag IDs
  // see https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml
  const CBOR_REF  = 25442;
  const CBOR_ID   = 25444;

  /**
   * CBOR tag handler mixin. Uses IDs to refer to previously serialised objects,
   * so they don't get serialised again.
   * Adds two CBOR tags:
   * * 25442 - CBOR_REF - reference to a previously serialised object
   * * 25444 - CBOR_ID - tag an object that might be referenced
   * NOTE: When using in conjunction with TypeMapMixin, this
   * mixin must always be a sublass of TypeMapMixin (come before
   * it in the mixins order)
   * @mixin IDREFMixin
   */
  return superclass => class IDREFMixin extends superclass {

    /**
     * @param {object} options
     */
    constructor(options) {
      super(options);

      /**
       * Array of frozen objects indexed by ID, for encoding.
       * @private
       * @member {object[]}
       */
      this.objectsFrozen = [];

      /**
       * Hash of thawed objects, keyed on ID, for decoding.
       * @private
       * @member {object.<number,object>}}
       */
      this.objectsThawed = {};

      /**
       * ID for a tagged object, to be applied to the next object read
       * by a decoder.
       */
      this.currentID = undefined;
    }

    /**
     * @override
     * @instance
     * @memberof IDREFMixin
     */
    finishDecoding(decoder, data) {
      super.finishDecoding(decoder, data);
      this.objectsThawed = {};
    }

    /**
     * @override
     * @instance
     * @memberof IDREFMixin
     */
    finishEncoding(encoder) {
      super.finishEncoding(encoder);
      for (const uf of this.objectsFrozen)
        delete uf[IB_ID];
      this.objectsFrozen = [];
    }

    /**
     * @override
     * @instance
     * @memberof IDREFMixin
     */
    encode(value, encoder) {
      if (typeof value === "object") {
        //if (encoder.debug) encoder.debug("Checking", value);
        if (typeof value[IB_ID] !== "undefined") {
          // Reference to previously frozen object
          encoder.writeTag(CBOR_REF);
          encoder.encodeItem(value[IB_ID]);
          return undefined;
        }

        const id = this.objectsFrozen.length;
        encoder.writeTag(CBOR_ID);
        encoder.encodeItem(id);
        value[IB_ID] = id;
        this.objectsFrozen.push(value);
      }
      return super.encode(value, encoder);
    }

    /**
     * @override
     * @instance
     * @memberof IDREFMixin
     */
    decode(tag, decoder) {
      let id, ref;
      switch (tag) {

      case CBOR_ID:
        // remember the ID for the following object (which will
        // be created by one of createArray or createObject)
        this.currentID = id = decoder.decodeItem();
        /* istanbul ignore if */
        if (decoder.debug) decoder.debug("\tIDREF: ID=", id);
        return decoder.decodeItem();

      case CBOR_REF:
        ref = decoder.decodeItem();
        /* istanbul ignore if */
        if (decoder.debug) decoder.debug("\tIDREF: REF to", ref);
        /* istanbul ignore if */
        if (!this.objectsThawed[ref])
          throw Error(`Reference to unthawed ${ref}`);
        return this.objectsThawed[ref];
      }

      return super.decode(tag, decoder);
    }

    /**
     * @override
     * @instance
     * @memberof IDREFMixin
     */
    createArray(decoder) {
      const ret = super.createArray(decoder);
      if (typeof this.currentID !== "undefined") {
        this.objectsThawed[this.currentID] = ret;
        /* istanbul ignore if */
        if (decoder.debug) decoder.debug("\tIDREF: created []", this.currentID);
        this.currentID = undefined;
      }
      return ret;
    }

    /**
     * @override
     * @instance
     * @memberof IDREFMixin
     */
    createObject(decoder, proto) {
      const ret = super.createObject(decoder, proto);
      if (typeof this.currentID !== "undefined") {
        this.objectsThawed[this.currentID] = ret;
        /* istanbul ignore if */
        if (decoder.debug) decoder.debug("\tIDREF: created {}", this.currentID);
        this.currentID = undefined;
      }
      return ret;
    }
  };
});
