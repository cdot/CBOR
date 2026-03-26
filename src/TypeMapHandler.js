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
 * TagHandler mixin to restore the prototype of a serialised object.
 * Prototyped objects have their prototype name serialised with them.
 *
 * The mixin accepts a `typeMap` option that is an object that maps
 * constructor (class) names. When an object is serialised, the
 * inheritance chain of that object is followed to
 * see if one of the constructors is in the `typeMap`. If it is, the
 * object is tagged with that constructor name. If it isn't found in
 * the typemap, or if no type map is given, the object will be
 * serialised as a plain (unprototyped) object. If the `keepAllProtos`
 * option is passed, all prototyped objects will be tagged with the
 * immediate prototype name.
 *
 * When deserialising, the `typeMap` must map prototype names to the
 * actual prototype. If the prototype name can't be found in the `typeMap`
 * it will be looked up in `window` (browser only, this won't work in node.js).
 * Failure to map a prototype is an error. You can supress the error
 * by passing the `skipMissingProtos` option. In this case, prototype names
 * that can't be mapped will be ignored during decoding.
 *
 * This allows us to serialise an object as one class, then deserialise
 * it as another.
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
     * @private
     * @member {object.<string,object>}
     */
    this.typeMap = this.options.typeMap || {};

    /**
     * Prototype of the next object to be created during
     * decoding. Mutually exclusive with pendingProtoID, not used
     * when useProtoDictionary is true.
     * @member {object}
     * @private
     */
    this.pendingProtoObject = undefined;

    /**
     * Prototype ID waiting to be added to a created object during
     * decoding. Mutually exclusive with pendingProtoObject, only used
     * when useProtoDictionary is true.
     * @member {string?}
     * @private
     */
    this.pendingProtoID = undefined;

    /**
     * Map from class ID to class name, only used
     * when useProtoDictionary is true.
     * @member {object.<number,string>}
     * @private
     */
    this.protoMap = undefined;
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
        const className = this.protoMap[classId];
        // Map the class name to the actual prototype
        let proto;
        if (this.typeMap[className])
          proto = this.typeMap[className].prototype;
        else if (typeof window !== "undefined")
          proto = window[className];
        // else window doesn't exist in node.js, all classes have
        // to be in the typeMap.

        /* istanbul ignore if */
        if (!proto && !this.options.skipMissingProtos)
          throw new Error(`decode could not find the prototype for "${className}"`);

        const newData = Object.assign(Object.create(proto), data);
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
    if (this.protoMap && this.protoMap.length > 0) {
      encoder.debug("finishEncoding: writing protoMap", this.protoMap.length);
      encoder.writeTag(CBOR_CID_MAP);
      encoder.encodeItem(this.protoMap);
    }
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  startDecoding(decoder) {
    super.startDecoding(decoder);
    this.protoMap = undefined;
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  finishDecoding(decoder, data) {
    data = super.finishDecoding(decoder, data);
    if (this.protoMap) {
      decoder.debug("finishDecoding: mapping placeholders", this.protoMap.length);
      // remap all placeholders to objects with protos
      data = this.mapPlaceholders(data);
      this.protoMap = undefined;
    }
    return data;
  }

  /**
   * @override
   * @instance
   * @memberof TypeMapHandler
   */
  encode(value, encoder) {
    // Get the constructor the object is most closely associated with
    let freezable = value.constructor;
    const exts = [];
    let protoEncoded = false;
    // SMELL: freezable will always be non-null, won't it?
    while (freezable && freezable.name !== "Object"
           && freezable.name !== "Array") {
      encoder.debug(`encode: encoding a ${freezable.name}`);
      exts.push(freezable.name);
      if (this.options.keepAllProtos || this.typeMap[freezable.name]) {
        encoder.debug(`TMH encode: ${freezable.name} is encodable`);
        encoder.writeTag(CBOR_CID);
        if (this.options.useProtoDictionary) {
          // Map the constructor name to an ID
          let protoIndex = -1;
          if (!this.protoMap)
            this.protoMap = [];
          else
            protoIndex = this.protoMap.indexOf(freezable.name);
          if (protoIndex < 0) {
            this.protoMap.push(freezable.name);
            protoIndex = this.protoMap.length - 1;
          }
          encoder.debug(`TMH encode: ${freezable.name} is ${protoIndex}`);
          encoder.encodeItem(protoIndex);
        } else
          // Store the whole name
          encoder.encodeItem(freezable.name);
        protoEncoded = true;
        encoder.debug(`\tClassed ${exts.join("-")}`);
        break; // while
      }
      // Same as freezable.__proto__ (__proto__ is non-standard)
      freezable = Object.getPrototypeOf(freezable);
    }

    /* istanbul ignore if */
    if (!protoEncoded && !Array.isArray(value))
      encoder.debug(`\tCan't encode prototype for ${exts.join("-")}`);

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
        let clasz;
        if (this.typeMap && this.typeMap[protoID])
          clasz = this.typeMap[protoID];
        else if (typeof window !== "undefined")
          clasz = window[protoID];
        // else node.js, window doesn't exist

        /* istanbul ignore if */
        if (!clasz) {
          if (!this.options.skipMissingProtos)
            throw new Error(`decode could not find the prototype for "${protoID}"`);
          // This object was tagged with a prototype ID that can't be resolved
          // to a class using the typeMap (or window in browser)
          // see #1 below
          decoder.debug(`decode: ${protoID} could not be resolved`);
          return undefined;
        }

        decoder.debug(`decode: map ${protoID} to ${clasz}`);

        // The next object created will get this prototype
        this.pendingProtoObject = clasz.prototype;

        // return undefined to let the decoder unpack the following objec.
        // When createObject is called, the pendingProtoObject will be used.
      } else {
        // Prototype name mapping
        this.pendingProtoID = protoID;
      }

      // #1 return undefined to let the decoder unpack the following object.
      // When createObject is called, the pendingProtoID will be stored
      // on the object. Then, when finishDecoding is called, these IDs
      // will be found and the objects rebuilt using the required prototypes.

      return undefined;
    } else if (tag === CBOR_CID_MAP) {
      decoder.debug(`decode: loading class map`);
      // Get the prototype map, mapping from prototype
      // ID to prototype name.
      this.protoMap = decoder.decodeItem();
      decoder.debug(`decode: Read ${this.protoMap.length} class names`);

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

