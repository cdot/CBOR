/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

define(() => {
  // Private CBOR tag IDs
  // see https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml
  const CBOR_CN   = 25443;

  /**
   * Mixin to restore the prototype of a serialised object.
   * The mixin is constructed with a type map, that maps constuctor
   * names to the actual prototype. When an object is serialised, the
   * prototype chain of that object is followed to see if the constructor
   * is in the type map. If it is, the object is tagged with that
   * constructor name.
   *
   * When deserialising, the typemap is looked up to recreate objects
   * with the relevant prototype.
   *
   * This allows us to serialise an object as one class, then deserialise
   * it as another, so long as they share a common prototype ancestor.
   *
   * Adds one CBOR tag:
   * * 25443 - the class name of an object.
   *
   * NOTE: When using in conjunction with IDREFMixin, this
   * mixin must always be a superclass of IDREFMixin (come after
   * it in the mixins order)
   * @mixin TypeMapMixin
   */
  return superclass => class TypeMapMixin extends superclass {

    /**
     * @param {object.<string,Class>} options.typeMap Map of prototype
     * name to actual prototype
     */
    constructor(options) {
      super(options);

      /**
       * Map of prototpe name to prototype.
       * @member {object.<string,object>}
       */
      this.typeMap = this.options.typeMap || {};

      /**
       * Prototype of the next object to be created.
       * @member {object}
       */
      this.pendingProto = undefined;
    }

    /**
     * @override
     * @instance
     * @memberof TypeMapMixin
     */
    encode(value, encoder) {

      if (value.constructor
          && value.constructor.name
          && value.constructor.name !== "Object") {

        let freezable = value.constructor;
        while (freezable.name !== "Object") {
          if (this.typeMap[freezable.name]) {
            encoder.writeTag(CBOR_CN);
            encoder.encodeItem(freezable.name);
            /* istanbul ignore if */
            if (encoder.debug)
              encoder.debug("\tclassified as", freezable.name);
            break;
          }
          freezable = Object.getPrototypeOf(freezable);
        }
      }

      // Allow other mixins to have a crack at the object
      return super.encode(value, encoder);
    }

    /**
     * @override
     * @instance
     * @memberof TypeMapMixin
     */
    decode(tag, decoder) {
      if (tag === CBOR_CN) {
        const cln = decoder.decodeItem();
        /* istanbul ignore if */
        if (decoder.debug) decoder.debug("Tag: CN", cln);

        const clzz = this.typeMap[cln];
        /* istanbul ignore if */
        if (!clzz)
          throw Error(`${cln} missing from type map`);

        // The next object created will get this prototype
        this.pendingProto = clzz.prototype;

        // return undefined to let the decoder unpack the following objec.
        // When createObject is called, the pendingProto will be applied.
        return undefined;
      }
      return super.decode(tag, decoder);
    }

    /**
     * @override
     * @instance
     * @memberof TypeMapMixin
     */
    createObject(decoder) {
      let ret;

      if (this.pendingProto) {
        ret = Object.create(this.pendingProto);
        this.pendingProto = undefined;
      } else
        ret = super.createObject(decoder);

      return ret;
    }
  };
});
