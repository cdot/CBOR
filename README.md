# CBOR

[CBOR](http://cbor.io/) library with pluggable tag handlers.

There are several CBOR implementations available from npm and github. This
is not intended to replace them, it was written when experiments with the
existing solutions failed, due to complexity, functionality, bugs,
or poor documentation.

This implementation doesn't claim to be the best; it is intended to write
and read complex ES6+ Javascript structures with small output, be
lightweight, well documented, and easy to extend.
It has the capability to read CBOR it didn't generate itself, but that's
not the primary intention. It's a lot lighter than [cbor-x](https://github.com/kriszyp/cbor-x) (cbor-x is recommended if you want a general CBOR solution).

* Zero production dependencies
* Works in browser and node.js
* Well documented, clearly structured Javascript

## Installation

Install it using:
```
$ npm install @cdot/cbor
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
import { Encoder, Decoder } from "@cdot/cbor";
const frozen = Encoder.encode(data);
```

### CommonJS

```
const { Encoder, Decoder } = require("@cdot/cbor");
const frozen = Encoder.encode(data);
```

## AMD

```
require(["@cdot/cbor"], CBOR => {
   const frozen = CBOR.Encoder.encode(data);
});
```

## Browser

```
<script type="text/javascript" src="./node_modules/@cdot/cbor/dist/index.js"></script>
    <script>
      const frozen = CBOR.Encoder.encode(data);
    </script>
```

## Tags

CBOR uses the concept of "tags", user-defined extension points to the protocol.
Included are a number of handlers that define some useful behaviours.

We use subclass factories to implement handlers as mixins, as described [here](https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/). This lets you easily use multiple tag handlers. For example:
```
const handler =
   new (IDRefHandler(TypeMapHandler(TagHandler)))();
```
Generally if you use any of the handlers described below, you should pass
the same parameters to the handlers used to encode and decode the data
(though there are exceptions to this).

## IDREFHandler

Optimises the output by never saving the same structure twice. For example, you might have the following:
```
const simple = { ... };
const complex = { once: simple, twice: simple };
```
The basic encoder will write two copies of `simple` to the output.
If instead we use the IDREF handler:
```
const handler = new (IDREFHandler(TagHandler))();
const frozen = CBOR.Encoder.encode(complex, handler);
...
const decoded = CBOR.Decoder.decode(frozen, handler);

```
The handler will now spot the double-reference to `simple` and only write
it once, and the decoder will restore the original data structure. The
handler also supports self-referential structures (without it, these will
break).

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
const handler = new (TypeMapHandler(TagHandler))({
    typeMap: { Thing: Thing }
});
const frozen = CBOR.Encoder.encode(data, handler);
...
const decoded = CBOR.Decoder.decode(frozen, handler);
```
when this is decoded using the same tag handler, the original
prototype will be restored.

The keys in the type map let the encoder determine the prototypes you
want to remember. When an object is serialised, the prototype chain of
that object is followed to see if the constructor name is in the type
map. During decoding, the type map maps the prototype name to the actual
prototype object. During instantiation of a class in the
decoder, the constructor will be called with no parameters and the
properties written into the instance after construction.

If the prototype of an object being serialised (or one of it's superclasses)
can't be found in the type map, then it will be serialised as a plain
(unprototyped) object. If the `keepAllProtos` option is passed, all
prototyped objects will be tagged with the immediate prototype name.
```
const data = [ new Thing(), new Thong() ];
const inhandler = new (TypeMapHandler(TagHandler))({
    keepAllProtos: true
});
const frozen = CBOR.Encoder.encode(data, inhandler);
...
const inhandler = new (TypeMapHandler(TagHandler))({
    typeMap: { Thing: Thing, Thong: Thong }
});
const decoded = CBOR.Decoder.decode(frozen, inhandler);
```

When deserialising, the `typeMap` must map prototype names to the
actual prototype. If the prototype name can't be found in the `typeMap`
it will be looked up in `window` (browser only, this won't work in node.js).
Failure to map a prototype name will throw an error. You can supress the error
by passing the `skipMissingProtos` option. In this case, prototype names
that can't be mapped will be ignored during decoding. Using the
previous example:
```
const inhandler = new (TypeMapHandler(TagHandler))({
    skipMissingProtos: true
});
const decoded = CBOR.Decoder.decode(frozen, inhandler);
```
The prototypes `Thing` and `Thong` will be lost, but all properties
will be present.

Note that if you want to use both the `IDREFHandler` and the `TypeMapHandler`
then you MUST include the `IDREFHandler` in the prototype chain first, thus:
```
const inhandler = new (IDREFHandler(TypeMapHandler(TagHandler)))(...);
```
This will NOT work:
```
const handler = new (TypeMapHandler(IDREFHandler(TagHandler))(...);
```

If the encoded output is still too big because of type names being encoded as
string literals, you can pass the `useProtoDictionary` option to the encoding handler to create class name dictionary.
```
const outhandler = new (TypeMapHandler(TagHandler))({
  useProtoDictionary: true
});
```
Sometimes using a dictionary can yield a performance improvement.

The handler will also work with prototypal inheritance (old-style classes built
using function constructors).

## KeyDictionaryHandler

If you are saving lots of data structures that are the same, then the basic
encoder will save all the property names for each instance saved. So if you
have a structure like this:
```
class Location {
  latitude = 0;
  longitude = 0;
}
const data = [ ... array of 10,000 Location ... ]
```
then there will be 10,000 copies of the word `latitude` and 10,000 copies of the word `longitude` in the output. To
optimise this, the `KeyDictionaryHandler` creates a lookup table of key
strings and replaces the keys with a simple ID. When the data is
decoded, the key dictionary is used to recreate the original property names.

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
of one of the existing tag handlers. If you generate a pull request for your
new handler, please ensure you provide a mocha test for it and test the
interaction with the other handlers.

## Streams

You can also use the encoder and decoder on streams by wrapping the stream
with a subclass of `DataInStream`/`DataOutStream`. See the code documentation
for details.
