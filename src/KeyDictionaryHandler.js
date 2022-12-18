/*Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

// Rename keys from their temporary index form to the actual key
// looked up in the key dictionary. This is only used when a key
// dictionary is read from the end of the input data.
const key_re = /^_#_(.+)$/;
const PROCESSED = "#(^)#";

/**
 * Locate uses of key placeholders in data and replace them with
 * the real key.
 * @private
 */
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
 * @mixin KeyDictionaryHandler
 */
const KeyDictionaryHandler = superclass => class extends superclass {

  /**
   * The same parameters have to be provided to the tag handlers
   * at both ends of the communication.
   * @param {string[]} options.keys list of keys for the key dictionary
   */
  constructor(options) {
    super(options);

    /**
     * Map from key name to integer ID. Used in encoding only.
     * @member {object.<string,number>}
     * @private
     */
    this.k2i = {};

    /**
     * List of known keys when the handler is constructed. Used in
     * encoding and decoding.
     * @member {string[]}
     * @private
     */
    this.i2k = [];

    if (this.options.keys)
      this.options.keys.forEach(k => {
        this.k2i[k] = this.i2k.length;
        this.i2k.push(k);
      });

    /**
     * List of keys added during encoding because they were not found
     * in i2k. Used in encoding and decoding.
     * @member {string[]}
     * @private
     */
    this.i2k_added = [];
  }

  /**
   * @override
   * @instance
   * @memberof KeyDictionaryHandler
   */
  finishEncoding(encoder) {
    super.finishEncoding(encoder);
    encoder.encodeItem(this.i2k_added);
  }

  /**
   * @override
   * @instance
   * @memberof KeyDictionaryHandler
   */
  finishDecoding(decoder, data) {
    super.finishDecoding(decoder, data);
    // Get the key dict
    this.i2k_added = decoder.decodeItem();
    /* istanbul ignore if */
    if (this.options.debug)
      this.options.debug(`Read ${this.i2k_added.length} added keys`);
    // remap all keys. i2k_added is contiguous after i2k
    remapKeys(data, [ ...this.i2k, ...this.i2k_added ]);
  }

  /**
   * @override
   * @instance
   * @memberof KeyDictionaryHandler
   */
  encodeKey(key, encoder) {
    if (typeof super.encodeKey(key, this) === "undefined") {
      /* istanbul ignore if */
      if (this.options.debug)
        this.options.debug(`\tKDh ignore ${key}`);
      return undefined;
    }
    if (!this.i2k)
      return key;
    let id = this.k2i[key];
    if (typeof id === "undefined") {
      /* istanbul ignore if */
      this.k2i[key] = id = this.i2k.length + this.i2k_added.length;
      if (this.options.debug)
        this.options.debug(`\tKDh add ${key} ${id}`);
      this.i2k_added.push(key);
    }
    return id;
  }

  /**
   * @override
   * @instance
   * @memberof KeyDictionaryHandler
   */
  decodeKey(id, decoder) {
    if (id < this.i2k.length)
      return this.i2k[id];

    // id is not in the supplied key index.
    // The dictionary for supplemental keys will be read at the end
    // of the input data. For now, we insert a placeholder key that
    // will be resolved at the end of decoding, when we have unpacked
    // the dictionary.
    // SMELL: there's a vanishingly small risk that this might
    // duplicate a "real" key.
    return `_#_${id}`;
  }
};

export { KeyDictionaryHandler }
