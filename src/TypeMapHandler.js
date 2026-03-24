/*@preserve Copyright (C) 2022-2026 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

// Private CBOR tag IDs
// see https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml
const CBOR_CID = 25443;
const CBOR_CID_MAP = 25445;

// with real field names.
const CLASS_ID = "ଈqആ";

/**
 * TagHandler mixin to restore the class of a serialised object.
 * The mixin is constructed with a type map that maps constuctor
 * names to the actual class object. When an object is serialised, the
 * inheritance chain of that object is followed to see if the constructor
 * is in the type map. If it is, the object is tagged with that
 * constructor name.
 *
 * When deserialising, the typemap is looked up to recreate objects
 * with the relevant prototype.
 *
 * This allows us to serialise an object as one class, then deserialise
 * it as another, so long as they share a common prototype ancestor.
 *
 * Adds two CBOR tags:
 * * 25443 - the prototype name of an object.
 * * 25445 - optional map from prototype ID to prototype name
 *
 * NOTE: When using in conjunction with IDREFHandler, this
 * mixin must always be a superclass of IDREFHandler (come after
 * it in the mixins order)
 * @mixin TypeMapHandler
 */
const TypeMapHandler = superclass => class TypeMapHandler extends superclass {

  /**
   * @param {object.<string,Class>?} options.typeMap Map of prototype
   * name to actual prototype
   */
  constructor(options) {
    super(options);

    /**
     * Map of prototype name to prototype object.
     * @member {object.<string,object>}
     */
    this.typeMap = this.options.typeMap || {};

    /**
     * Prototype of the next object to be created during
     * decoding. Mutually exclusive with pendingProtoID, not used
     * when mapClassNames is true.
     * @member {object}
     * @private
     */
    this.pendingProtoObject = undefined;

    /**
     * Prorotype ID waiting to be added to a created object during
     * decoding. Mutually exclusive with pendingProtoObject, only used
     * when mapClassNames is true.
     * @member {string?}
     */
    this.pendingProtoID = undefined;

    /**
     * Map from class ID to class name, only used
     * when mapClassNames is true.
     * @member {object.<number,string>}
     */
    this.classMap = undefined;
  }

  /**
   * Locate prototype placeholders in the objects in data
   * and convert them to objects.
   * @param {object} data the data to scan
   * @return {object} data with objects converted
   * @private
   */
  mapPlaceholders(data) {
    if (typeof data === "object" && data !== null) {
      let keys;
      if (Array.isArray(data)) {
        keys = [];
        for (let i = 0; i < data.length; i++)
          keys[i] = i;
      } else
        keys = Object.keys(data);

      for (const f of keys)
        data[f] = this.mapPlaceholders(data[f]);

      const classId = data[CLASS_ID];
      if (typeof classId === "number") {
        delete data[CLASS_ID];
        // Map ID to the class name
        const className = this.classMap[classId];
        // Map the class name to the actual prototype
        const proto = this.typeMap[className].prototype;
        if (!proto)
          throw Error(`${className} missing from type map`);

        // SMELL: Would Object.setPrototypeOf be better? Doc says
        // it is much slower, but it would avoid having to use remap.
        const newData = Object.create(proto);
        for (const f of Object.keys(data))
          newData[f] = data[f]; // data already has placeholders mapped

        data = newData;
      }
    }
    return data;
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  finishEncoding(encoder) {
    super.finishEncoding(encoder);
    // Write the class map (if there is one)
    if (this.classMap && this.classMap.length > 0) {
      encoder.debug("finishEncoding: writing classMap", this.classMap.length);
      encoder.writeTag(CBOR_CID_MAP);
      encoder.encodeItem(this.classMap);
    }
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  startDecoding(decoder) {
    super.startDecoding(decoder);
    this.classMap = undefined;
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  finishDecoding(decoder, data) {
    data = super.finishDecoding(decoder, data);
    if (this.classMap) {
      decoder.debug("finishDecoding: mapping placeholders", this.classMap.length);
      // remap all placeholders to objects with protos
      data = this.mapPlaceholders(data);
      this.classMap = undefined;
    }
    return data;
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  encode(value, encoder) {
    let freezable = value.constructor;
    const exts = [];
    let tagged = false;
    while (freezable && freezable.name !== "Object") {
      encoder.debug(`encode: encoding a ${freezable.name}`);
      exts.push(freezable.name);
      if (this.typeMap[freezable.name]) {
        encoder.debug(`encode: ${freezable.name} is in the typeMap`);
        encoder.writeTag(CBOR_CID);
        // Tradeoff:
        // The encoding for a 2-character ascii string is 1+1+2=4 bytes.
        // The encoding for an ID is going to be a maximum of 3 bytes,
        // but the cost of mapping via IDs is quite high so we're better
        // off using the character representation for short names.
        if (this.options.mapClassNames && freezable.name.length > 2) {
          // Map the constructor name to an ID
          let protoIndex = -1;
          if (!this.classMap)
            this.classMap = [];
          else
            protoIndex = this.classMap.indexOf(freezable.name);
          if (protoIndex < 0) {
            this.classMap.push(freezable.name);
            protoIndex = this.classMap.length - 1;
          }
          encoder.debug(`encode: ${freezable.name} is index ${protoIndex}`);
          encoder.encodeItem(protoIndex);
        } else {
          encoder.encodeItem(freezable.name);
        }
        tagged = true;
        encoder.debug(`\tTYPE_TAG ${exts.join("-")}`);
        break; // while
      }
      freezable = Object.getPrototypeOf(freezable);
    }

    if (!tagged && !Array.isArray(value))
      encoder.debug(`\tCAN'T TYPE-TAG ${exts}`);

    // Allow other mixins to have a crack at the object
    return super.encode(value, encoder);
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  decode(tag, decoder) {
    if (tag === CBOR_CID) {
      const protoID = decoder.decodeItem();
      decoder.debug("Tag: CN protoID", protoID);
      if (typeof protoID === "string") {
        // Simple prototype name
        /* istanbul ignore if */
        const clasz = this.typeMap[protoID];
        decoder.debug(`decode: map ${protoID} to ${clasz}`);
        /* istanbul ignore if */
        if (!clasz)
          throw Error(`${protoID} missing from type map`);
        // The next object created will get this prototype
        this.pendingProtoObject = clasz.prototype;

        // return undefined to let the decoder unpack the following objec.
        // When createObject is called, the pendingProtoObject will be used.
      } else {
        // Prototype name mapping

        this.pendingProtoID = protoID;
      }

      // return undefined to let the decoder unpack the following object.
      // When createObject is called, the pendingProtoID will be stored
      // on the object. Then, when finishDecoding is called, these IDs
      // will be found and the objects rebuilt using the required prototypes.

      return undefined;
    } else if (tag === CBOR_CID_MAP) {
      decoder.debug(`decode: loading class map`);
      // Get the prototype map, mapping from prototype
      // ID to prototype name.
      this.classMap = decoder.decodeItem();
      decoder.debug(`decode: Read ${this.classMap.length} class names`);

      // return *something* defined so the decoder doesn't attempt
      // to decode the following item.
      return this;
    }
    return super.decode(tag, decoder);
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  createObject(decoder) {
    let ret;
    // Objects belonging to classes are marked with a CN.
    if (typeof this.pendingProtoID !== "undefined") {
      if (this.pendingProtoObject)
        throw new Error("Both pendingProtoID and pendingProtoObject present");

      // Mark object as needing mapping to a prototype in
      // finishDecoding
      ret = super.createObject(decoder);
      decoder.debug(`createObject: marking a ${this.pendingProtoID}`);
      ret[CLASS_ID] = this.pendingProtoID;
      this.pendingProtoID = undefined;
      
    } else if (this.pendingProtoObject) {

      // SMELL: why isn't this super.createObject?
      ret = super.createObject(decoder, this.pendingProtoObject);
      this.pendingProtoObject = undefined;

    } else
      ret = super.createObject(decoder);

    return ret;
  }
};

export default TypeMapHandler;

