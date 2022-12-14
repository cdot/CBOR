# CBOR
CBOR library with pluggable tag handlers.

This implementation is intended to write and read complex ES6+ Javascript
structures with minimum size output, and be easy to extend. It has the
capability to read CBOR it didn't generate itself, but that's not the
primary intention. It's a lot lighter than [cbor-x](https://github.com/kriszyp/cbor-x) (cbor-x is recommended if you want a general CBOR solution).

* AMD module that works in browser and node.js using requirejs.
* Pure, well documented, clearly structured ES6 Javascript.
* Minimal production dependencies
* Test suite using Mocha.

Install it using:
```
$ npm install --production --save https://github.com/cdot/CBOR
```
If you are just using it to save/restore simple data structures,
with no requirement for data size optimisation, use it as follows:
```
const outs = new MemoryOutStream();
new Encoder(outs).encode(decoded);
const frozen = outs.Uint8Array;
```
`frozen` is a `Uint8Array`, the buffer of which can be written e.g. to a file using node.js fs, or to a network partner.

To decode incoming data:
```
const ins = new MemoryInStream(frozen);
const decoded = new Decoder(ins).decode();
```
`data` can be a `DataView`, a `TypedArray`, or an `ArrayBuffer`.

## TagHandler
The tag handler provides the basic support for handling special tags in the
CBOR data. These tags are usually user-defined. Included are three tag
handlers that define a number of tags for you.

We use subclass factories to implement handlers as mixins, as described [here](https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/). This lets you use multiple tag handlers. For example:
```
const handler =
new (KeyDictionaryHandler(IDRefHandler(TypeMapHandler(TagHandler))();
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
The basic encoder will write two copies of `simple` to the output. If instead we
write it using:
```
const handler = new IDREFHandler(TagHandler)();

const outs = new MemoryOutStream();
new Encoder(outs, handler).encode(complex);
const frozen = outs.Uint8Array;
...
const ins = new MemoryInStream(frozen);
const decoded = new Decoder(ins, handler).decode();

```
The encoder will now spot the double-usage of `simple` and only write it once, and the decoder will restore the original data structure. The handler even supports self-referential structures.

## TypeMapHandler
Lets you record complex types (classes) in the output data. For example:
```
class Thing {
   field = 99.99;
}
const data = new Thing();
```
The basic encoder will write this data structure but when decoded you will get back:
```
{ field: 99.99 }
```
i.e. the prototype `Thing` will be lost. If instead we write it using:
```
const outs = new MemoryOutStream();
const handler = new TypeMapHandler(TagHandler)({
    typeMap: { Thing: Thing }
});
new Encoder(outs, handler).encode(data);
```
when this is decoded by a decoder using the same tag handler, the original
prototype will be restored.

Note that instances of subclasses of a class mentioned in the type map will be
regenerated according to the type map used with the decoder. So it's possible to
change the class of an object thus:
```
class Thing { ... }
class subThing extends Thing { ... }
const data = new subThing();
const outs = new MemoryOutStream();
const outhandler = new TypeMapHandler(TagHandler)({
    typeMap: { Thing: Thing }
});
new Encoder(outs, outhandler).encode(data);
const frozen = outs.Uint8Array;
...
class newThing extends Thing { ... }
const inhandler = new TypeMapHandler(TagHandler)({
    typeMap: { Thing: newThing }
});
const ins = new MemoryInStream(frozen);
const decoded = new Decoder(ins, inhandler).decode();
```
`decoded` will now be an instance of class `newThing` with all the same attributes as the original `data`.

Note that if you want to use both the IDREFHandler and the TypeMapMIXIN then you MUST include the IDREFHandler in the prototype chain first, thus:
```
const inhandler = new IDREFHandler(TypeMapHandler(TagHandler)(...));
```
This will NOT work:
```
const inhandler = new TypeMapHandler(IDREFHandler(TagHandler)(...));
```

## KeyDictionaryHandler
If you are saving lots of data structures that are the same, then the basic
encoder will save all the attribute names in the output. So if you have a
structure like this:
```
class Location {
  latitude = 0;
  longitude = 0;
}

const data = [ ... array of 10,000 new Location() ... ]
```
then there will be 10,000 copies of the word `latitude` in the output. To
optimise this, the KeyDictionaryHandler creates a lookup table of key strings
an replaces the keys with a simple integer ID. When the data is decoded, the
key dictionary if used to recreate the original attribute names.

The handler can be used with an existing list of keys e.g.
```
const handler = new (KeyDictionaryHandler(TagHandler))({
  keys: [ "latitude", "longitude" ]
});
```
You can also provide a partial key list:
```
const handler = new (KeyDictionaryHandler(TagHandler))({
  keys: [ "latitude" ],
  writeKeyDict: true
});
```
In this case the `longitude` key will be added to the dictionary on the fly.
The dictionary will only be written to the output if additional keys are
added during encoding.

It can also create a new dictionary on the fly that is saved with the data.
```
const handler = new KeyDictionaryHandler(TagHandler)({
  writeKeyDict: true
});
```
The output will be smallest (and the encode/decode fastest) if you provide a full key dictionary.

## Other Tag Handlers

You can define your own tags and tag handlers. Simply follow the pattern
of one of the existing tag handlers. If you generate pull request for your
new handler, please ensure you provide a mocha test for it and test the
interaction with the other handlers.
