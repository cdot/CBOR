/*@preserve Copyright (C) 2022 Crawford Currie https://github.com/cdot
  License MIT. See README.md at the root of this distribution for full copyright
  and license information.*/

// Package up all modules into a single module for export
import { Decoder } from "./Decoder.js";
import { Encoder } from "./Encoder.js";
import { TagHandler } from "./TagHandler.js";
import { TypeMapHandler } from "./TypeMapHandler.js";
import { KeyDictionaryHandler } from "./KeyDictionaryHandler.js";
import { IDREFHandler } from "./IDREFHandler.js";
import { MemoryInStream } from "./MemoryInStream.js";
import { MemoryOutStream } from "./MemoryOutStream.js";
import { DataInStream } from "./DataInStream.js";
import { DataOutStream } from "./DataOutStream.js";

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
