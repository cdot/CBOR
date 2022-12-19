/*Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

// Placeholder key construction. Mixed unicode scripts are used to
// minimise risk of collision with real key names.
const SECRET = "ആଈ";

// Rename keys from their placeholder form to the actual key looked up
// in the key dictionary.
const key_re = new RegExp(`^${SECRET}(.+)$`);

// Key used when a datum has already been processed - removed after
// key remapping. Mixed unicode scripts are used to minimise risk of
// collision with real key names.
const PROCESSED = "ρѓσςεรຂεϑ";

/**
 * Locate uses of key placeholders in data and replace them with
 * the real key.
 * @private
 */
function remapKeys(data, i2k) {
  const processed = [];

  function _remapKeys(data) {
    if (typeof data === "object" && data !== null) {
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
 * To reduce data volume, use a key dictionary (a list of all known
 * keys used in JS objects). This can save a lot of space when a lot
 * of similar objects are used.
 * @mixin KeyDictionaryHandler
 */
const KeyDictionaryHandler = superclass => class extends superclass {

  /**
   * The same parameters have to be provided to the tag handlers
   * at both ends of the communication.
   * @param {string[]} options.keys list of known keys for the key.
   * Minimum output size will be achieved when this list is complete
   * i.e. all possible keys are known in advance.
   * @param {function?} options.added optional function called when an
   * unknown key is added to the key set. Passed the key and the id it was
   * assigned. This can be useful when building a comprehensive key set
   * for communication in complex code.
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
      // It might seem tempting to compare the encoding length of the
      // id against the raw key length, but it rarely improves the
      // data volume enough to make the complexity worthwhile.
      this.k2i[key] = id = this.i2k.length + this.i2k_added.length;
      if (this.options.added)
        this.options.added(key, id);
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
    return `${SECRET}${id}`;
  }
};

export { KeyDictionaryHandler }
