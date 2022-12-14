/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

// Package up all modules into a single module for export
import Decoder from "./Decoder.mjs";
import Encoder from "./Encoder.mjs";
import TagHandler from "./TagHandler.mjs";
import TypeMapHandler from "./TypeMapHandler.mjs";
import KeyDictionaryHandler from "./KeyDictionaryHandler.mjs";
import IDREFHandler from "./IDREFHandler.mjs";
import MemoryInStream from "./MemoryInStream.mjs";
import MemoryOutStream from "./MemoryOutStream.mjs";
import DataInStream from "./DataInStream.mjs";
import DataOutStream from "./DataOutStream.mjs";

export {
  Decoder,
  Encoder,
  TagHandler,
  TypeMapHandler,
  KeyDictionaryHandler,
  IDREFHandler,
  MemoryInStream,
  MemoryOutStream,
  DataInStream,
  DataOutStream
};
