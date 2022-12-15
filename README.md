# CBOR
[CBOR](http://cbor.io/) library with pluggable tag handlers.

There are several CBOR implementations available from npm and github. This
is not intended to replace them, it was written when experiments with the
existing solutions failed, due either to complexity, functionality, or poor
documentaion.

This implementation doesn't claim to be the best; it is intended to write
and read complex ES6+ Javascript structures with small output, be
lightweight, well documented, and easy to extend.
It has the capability to read CBOR it didn't generate itself, but that's
not the primary intention. It's a lot lighter than [cbor-x](https://github.com/kriszyp/cbor-x) (cbor-x is recommended if you want a general CBOR solution).

* Zero production dependencies
* Works in browser and node.js
* Well documented, clearly structured Javascript
* Test suite using Mocha.

## Installation
Install it using:
```
$ npm install git+https://github.com/cdot/CBOR
```
## Usage
If you are just using it to save/restore simple data structures,
with no requirement for data size optimisation, use it as follows.

To encode some data using CBOR:
```
const frozen = CBOR.Encoder.encode(data);
```
`frozen` is a `Uint8Array`, the buffer of which can be written e.g. to a file using node.js fs, or to a network partner.

To decode incoming data:
```
const decoded = CBOR.Decoder.decode(frozen);
```
`frozen` can be a `DataView`, a `TypedArray`, or an `ArrayBuffer`.

### ESM
```
import { Encoder, Decoder } from "./node_modules/@cdot/cbor/src/index.js";
const frozen = Encoder.encode(data);
```
### CJS
```
const CBOR = require("@cdot/cbor");
const frozen = CBOR.Encoder.encode(data);
```
## `requirejs`
```
requirejs(["@cdot/cbor"], CBOR => {
   const frozen = CBOR.Encoder.encode(data);
});
```
## Browser (no ESM)
```
<script type="text/javascript" src="./node_modules/@cdot/cbor/dist/index.js"></script>
    <script>
      const frozen = CBOR.Encoder.encode(data);
    </script>
```
## Tags
CBOR uses the concept of "tags", user-defined extension points to the protocol.
This module defines a number of "tag handlers" that define some useful tags.

We use subclass factories to implement handlers as mixins, as described [here](https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/). This lets you easily use multiple tag handlers. For example:
```
const handler =
   new (IDRefHandler(TypeMapHandler(TagHandler)))();
```
Generally if you use any of the handlers described below, you should pass
the same parameters to the handlers used to encode and decode the data
(though there are exceptions to this, see TypeMapHandler).

## IDREFHandler
Optimises the output by never saving the same structure twice. For example, you might have the following:
```
const simple = { ... };
const complex = { once: simple, twice: simple };
```
The basic encoder will write two copies of `simple` to the output.
If instead we use the IDREF handler:
```
const handler = new IDREFHandler(TagHandler)();
const frozen = CBOR.Encoder.encode(complex, handler);
...
const decoded = CBOR.Decoder.decode(frozen, handler);

```
The handler will now spot the double-reference to `simple` and only write
it once, and the decoder will restore the original data structure. The
handler also supports self-referential structures.

## TypeMapHandler
Lets you record complex types (classes) in the output data. For example:
```
class Thing {
   field = 99.99;
}
const data = new Thing();
```
The basic encoder will write this data structure, but when decoded you
will get back:
```
{ field: 99.99 }
```
i.e. the prototype `Thing` will be lost. If instead we write:
```
const handler = new TypeMapHandler(TagHandler)({
    typeMap: { Thing: Thing }
});
const frozen = CBOR.Encoder.encode(data, handler);
```
when this is decoded using the same tag handler, the original
prototype will be restored.

Note that instances of subclasses of a class mentioned in the type map will be
regenerated according to the type map used with the decoder. So it's possible to
change the class of an object thus:
```
class Thing { ... }
class subThing extends Thing { ... }
const data = new subThing();
const outhandler = new TypeMapHandler(TagHandler)({
    // Save all subclasses of 'Thing' as class 'Thing'
    typeMap: { Thing: Thing }
});
const frozen = CBOR.Encoder.encode(data, outhandler);
...
class newThing extends Thing { ... }
const inhandler = new TypeMapHandler(TagHandler)({
    // Map all saved 'Thing's to 'newThing'
    typeMap: { Thing: newThing }
});
const decoded = CBOR.Decoder.decode(frozen, inhandler);
```
`decoded` will now be an instance of class `newThing` with all the same
attributes as the original `data` (including any additional attributes
added when it was a `subThing`).

Note that if you want to use both the IDREFHandler and the TypeMapHandler
then you MUST include the IDREFHandler in the prototype chain first, thus:
```
const inhandler = new IDREFHandler(TypeMapHandler(TagHandler)(...));
```
This will NOT work:
```
const inhandler = new TypeMapHandler(IDREFHandler(TagHandler)(...));
```

## KeyDictionaryHandler
If you are saving lots of data structures that are the same, then the basic
encoder will save all the attribute names for each instance saved. So if you
have a structure like this:
```
class Location {
  latitude = 0;
  longitude = 0;
}
const data = [ ... array of 10,000 new Location() ... ]
```
then there will be 10,000 copies of the word `latitude` in the output. To
optimise this, the KeyDictionaryHandler creates a lookup table of key strings
and replaces the keys with a simple integer ID. When the data is decoded, the
key dictionary is used to recreate the original attribute names.

The handler can be used with an known list of keys e.g.
```
const handler = new (KeyDictionaryHandler(TagHandler))({
  keys: [ "latitude", "longitude" ]
});
```
You can also provide a partial key list:
```
const handler = new (KeyDictionaryHandler(TagHandler))({
  keys: [ "latitude" ]
});
```
In this case the `longitude` key will be added to the dictionary during
encoding. The dictionary written to the output will only contain the
additional keys added during encoding.

If you don't provide any keys, or provide an empty keys array, then all
keys will be saved.

## Other Tag Handlers

You can define your own tags and tag handlers. Simply follow the pattern
of one of the existing tag handlers. If you generate pull request for your
new handler, please ensure you provide a mocha test for it and test the
interaction with the other handlers.

## Streams
You can also use the encoder and decoder on streams. See the code documentation
for details.
