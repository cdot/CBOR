/*Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

define([
  "./Encoder", "./MemoryOutStream"
], (
  Encoder, MemoryOutStream
) => {

  // Rename keys from their temporary index form to the actual key
  // looked up in the key dictionary. This is only used when a key
  // dictionary is read from the end of the input data.
  const key_re = /^_#_(.+)$/;
  const PROCESSED = "#(^)#";
  function remapKeys(data, i2k) {
    const processed = [];
    function _remapKeys(data) {
      if (typeof data === "object") {
        if (Array.isArray(data)) {
          for (const d of data)
            _remapKeys(d);
          return;
        }
        if (data[PROCESSED]) return;
        processed.push(data);
        data[PROCESSED] = true;
        const oldKeys = Object.keys(data);
        for (const f of oldKeys) {
          _remapKeys(data[f]);
          const m = key_re.exec(f);
          if (m) {
            data[i2k[m[1]]] = data[f];
            delete data[f];
          }
        }
      }
    }
    _remapKeys(data);
    // clean up
    for (const p of processed)
      delete p[PROCESSED];
  }

  /**
   * To reduce data volume, it is possible to use a key dictionary (a
   * list of all known keys used in JS objects). This can save a lot of
   * space when a lot of similar objects are used.
   * This mixin can be used in 3 modes:
   * * known keys, where the caller provides a list of keys they expect
   *   to be there.
   * * partial keys, where some (but not necessarily all) keys are known
   *   at write time.
   * * unknown keys, where no keys are known.
   * The size of the generated binary will vary according to which mode
   * is used, with known keys being the smallest and fastest, and unknown
   * keys the largest and slowest.
   * @mixin KeyDictionaryMixin
   */
  return superclass => class KeyDictionaryMixin extends superclass {

    /**
     * The same parameters have to be provided to the tag handlers
     * at both ends of the communication.
     * @param {string[]} options.keys list of keys for the key dictionary
     * @param {boolean} options.writeKeys if true, write the keys into the output
     * data (and expect to see them at the end of input data).
     */
    constructor(options) {
      super(options);
      this.writeKeyDict = this.options.writeKeyDict;
      if (this.options.keys || this.options.writeKeyDict) {
        this.k2i = {};
        this.i2k = [];
        if (this.options.keys)
          this.options.keys.forEach(k => {
            this.k2i[k] = this.i2k.length;
            this.i2k.push(k);
          });
      }
    }

    /**
     * @override
     * @instance
     * @memberof KeyDictionaryMixin
     */
    finishEncoding(encoder) {
      super.finishEncoding(encoder);
      if (this.options.writeKeyDict)
        encoder.encodeItem(this.i2k);
    }

    /**
     * @override
     * @instance
     * @memberof KeyDictionaryMixin
     */
    finishDecoding(encoder, data) {
      if (this.options.writeKeyDict) {
        // Get the key dict
        const i2k = encoder.decodeItem();
        remapKeys(data, i2k);
      }
      super.finishEncoding(encoder, data);
    }

    /**
     * @override
     * @instance
     * @memberof KeyDictionaryMixin
     */
    encodeKey(key, encoder) {
      if (typeof super.encodeKey(key, this) === "undefined")
        return undefined;
      if (!this.i2k)
        return key;
      let id = this.k2i[key];
      if (typeof id === "undefined") {
        /* istanbul ignore if */
        if (encoder.debug) encoder.debug(`ADD ${key}`);
        this.k2i[key] = id = this.i2k.length;
        this.i2k.push(key);
      }
      return id;
    }

    /**
     * @override
     * @instance
     * @memberof KeyDictionaryMixin
     */
    decodeKey(id, decoder) {
      if (this.options.writeKeyDict) {
        // The dictionary will be read at the end of the input data.
        // Insert a placeholder key that will be resolved
        // of decoding, when we have unpacked the dictionary.
        return `_#_${id}`;
      }
      if (!this.i2k)
        return id;
      /* istanbul ignore if */
      if (id < 0 || id >= this.i2k.length)
        throw Error(`No key with id ${id}`);
      return this.i2k[id];
    }
  };
});
