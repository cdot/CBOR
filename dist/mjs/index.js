/*! For license information please see index.js.LICENSE.txt */
var t={d:(e,r)=>{for(var i in r)t.o(r,i)&&!t.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:r[i]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e)},e={};t.d(e,{rK:()=>i,Fv:()=>a,h:()=>n,hm:()=>c,P8:()=>l,Ol:()=>m,Zz:()=>s,nr:()=>d,fq:()=>r,Vy:()=>u});class r{constructor(t){this.options=t||{}}encode(t,e){return t}decode(t,e){}startEncoding(t){}finishEncoding(t){}finishDecoding(t,e){}createArray(t){return[]}createObject(t,e){return e?Object.create(e):{}}encodeKey(t,e){if(!/^_/.test(t))return t}decodeKey(t,e){return t}}class i{readFloat16(){throw Error("DataInStream.readFloat16")}readFloat32(){throw Error("DataInStream.readFloat32")}readFloat64(){throw Error("DataInStream.readFloat64")}readUint8(){throw Error("DataInStream.readUint8")}readUint16(){throw Error("DataInStream.readUint16")}readUint32(){throw Error("DataInStream.readUint32")}readUint64(){}readUint8Array(t){throw Error("DataInStream.readUint8Array")}peekUint8(){throw Error("DataInStream.peekUint8")}get mark(){throw Error("DataInStream.get mark")}set mark(t){throw Error("DataInStream.set mark")}}class s extends i{view=void 0;readPos=0;constructor(t){if(super(),t instanceof DataView)this.view=t;else if(t instanceof ArrayBuffer)this.view=new DataView(t,0,t.length);else{if(!t.buffer||"number"!=typeof t.byteLength||"number"!=typeof t.byteOffset)throw console.log(t),Error("MemoryInStream: data unusable");this.view=new DataView(t.buffer,t.byteOffset,t.byteLength)}}peekUint8(){return this.view.getUint8(this.readPos)}readUint8(){const t=this.view.getUint8(this.readPos);return this.readPos+=1,t}readUint16(){const t=this.view.getUint16(this.readPos);return this.readPos+=2,t}readUint32(){const t=this.view.getUint32(this.readPos);return this.readPos+=4,t}readUint64(){return 4294967296*this.readUint32()+this.readUint32()}readFloat16(){const t=new ArrayBuffer(4),e=new DataView(t),r=this.readUint16(),i=32768&r;let s=31744&r;const n=1023&r;if(31744===s)s=261120;else if(0!==s)s+=114688;else if(0!==n)return(i?-1:1)*n*5.960464477539063e-8;return e.setUint32(0,i<<16|s<<13|n<<13),e.getFloat32(0)}readFloat32(){const t=this.view.getFloat32(this.readPos);return this.readPos+=4,t}readFloat64(){const t=this.view.getFloat64(this.readPos);return this.readPos+=8,t}readUint8Array(t){const e=new Uint8Array(this.view.buffer,this.view.byteOffset+this.readPos,t);return this.readPos+=t,e}}class n{constructor(t,e){this.stream=t,this.tagHandler=e||new r}readBreak(){return 255===this.stream.peekUint8()&&(this.stream.readUint8(),!0)}readArgument(t,e){if(t<24)return t;switch(t){case 24:return this.stream.readUint8();case 25:return this.stream.readUint16();case 26:return this.stream.readUint32();case 27:return this.stream.readUint64();case 31:switch(e){case 0:case 1:case 6:break;default:return-1}}throw Error(`Malformed ${e} ${t}`)}readIndefiniteBytes(t){const e=()=>{const e=this.stream.readUint8(),r=e>>5,i=31&e;if(31===i)return-1;if(r!==t)throw Error(`Major type mismatch on chunk ${r}!=${t}`);const s=this.readArgument(i,t);if(s<0)throw Error(`Invalid chunk length ${s}`);return s},r=[];let i,s=0;for(;(i=e())>=0;)this.debug&&this.debug(`\tCHUNK ${i} bytes`),s+=i,r.push(this.stream.readUint8Array(i));const n=new Uint8Array(s);let a=0;for(let t=0;t<r.length;t++)n.set(r[t],a),a+=r[t].length;return n}readItemArray(t){let e=this.tagHandler.createArray(this);for(let r=0;r<t;r++)e.push(this.decodeItem());return e}readIndefiniteItemArray(){const t=this.tagHandler.createArray(this);for(;!this.readBreak();)t.push(this.decodeItem());return t}readKV(t){const e=this.tagHandler.createObject(this);for(let r=0;r<t;r++){let t=this.decodeItem();t=this.tagHandler.decodeKey(t,this),e[t]=this.decodeItem()}return e}readIndefiniteKV(){const t=this.tagHandler.createObject(this);for(;!this.readBreak();)t[this.decodeItem()]=this.decodeItem();return t}decodeItem(){const t=this.stream.readUint8(),e=t>>5,r=31&t;let i,s,n,a;switch(e){case 0:return this.debug&&this.debug(`${this.stream.readPos}: UINT ${r}`),this.readArgument(r,0);case 1:return this.debug&&this.debug(`${this.stream.readPos}: -INT ${r}`),-1-this.readArgument(r,1);case 2:if(this.debug&&this.debug(`${this.stream.readPos}: BYTES ${r}`),31===r)return this.readIndefiniteBytes(e);if(i=this.readArgument(r,2),i<0)throw Error(`Invalid byte string length ${i}`);return this.stream.readUint8Array(i);case 3:if(31===r)this.debug&&this.debug(`${this.stream.readPos}: TEXT? ${r}`),n=(new TextDecoder).decode(this.readIndefiniteBytes(e));else{if(this.debug&&this.debug(`${this.stream.readPos}: TEXT `),i=this.readArgument(r,3),i<0)throw Error(`Invalid text length ${i}`);n=(new TextDecoder).decode(this.stream.readUint8Array(i))}return this.debug&&this.debug(`\t"${n}"`),n;case 4:if(31===r)return this.debug&&this.debug(`${this.stream.readPos}: ARRAY?`),this.readIndefiniteItemArray();if(i=this.readArgument(r,4),i<0)throw Error("Invalid array length ${len}");return this.debug&&this.debug(`${this.stream.readPos}: ARRAY ${i}`),this.readItemArray(i);case 5:if(31===r)return this.debug&&this.debug(`${this.stream.readPos}: MAP?`),this.readIndefiniteKV();if(i=this.readArgument(r,5),i<0)throw Error("Invalid map length ${len}");return this.debug&&this.debug(`${this.stream.readPos}: MAP length ${i}`),this.readKV(i);case 6:if(s=this.readArgument(r,6),this.debug&&this.debug(`${this.stream.readPos}: TAG ${s}`),a=this.tagHandler.decode(s,this),void 0!==a)return a;switch(s){case 0:case 1:return new Date(this.decodeItem())}return this.decodeItem();case 7:switch(this.debug&&this.debug(`${this.stream.readPos}: OTHER ${r}`),r){case 20:return!1;case 21:return!0;case 22:return null;case 23:return;case 24:return this.stream.readUint8();case 25:return this.stream.readFloat16();case 26:return this.stream.readFloat32();case 27:return this.stream.readFloat64()}return r}throw Error(`Unrecognised major type ${e}`)}decodes(){const t=this.decodeItem();return this.tagHandler.finishDecoding(this,t),t}static decode(t,e,r){const i=new s(t),a=new n(i,e);return a.debug=r,a.decodes()}}class a{writeUint8(t){throw Error("DataStream.writeUint8")}writeUint16(t){throw Error("DataStream.writeUint16")}writeUint32(t){throw Error("DataStream.writeUint32")}writeUint64(t){throw Error("DataStream.writeUint64")}writeFloat32(t){throw Error("DataStream.writeFloat32")}writeFloat64(t){throw Error("DataStream.writeFloat64")}writeUint8Array(t){for(let e=0;e<t.length;++e)this.writeUint8(this.writePos++,t[e])}}const o=2**32;class d extends a{view=new DataView(new ArrayBuffer(256));writePos=0;appendSpaceFor(t){const e=this.writePos+t,r=this.view.buffer.byteLength;let i=r;for(;i<e;)i*=2;if(i!==r){const t=new ArrayBuffer(i);new Uint8Array(t).set(new Uint8Array(this.view.buffer)),this.view=new DataView(t)}}writeUint8(t){this.appendSpaceFor(1),this.view.setUint8(this.writePos,t),this.writePos++}writeUint16(t){this.appendSpaceFor(2),this.view.setUint16(this.writePos,t),this.writePos+=2}writeUint32(t){this.appendSpaceFor(4),this.view.setUint32(this.writePos,t),this.writePos+=4}writeUint64(t){const e=t%o,r=(t-e)/o;this.writeUint32(r),this.writeUint32(e)}writeFloat32(t){this.appendSpaceFor(4),this.view.setFloat32(this.writePos,t),this.writePos+=4}writeFloat64(t){this.appendSpaceFor(8),this.view.setFloat64(this.writePos,t),this.writePos+=8}writeUint8Array(t){this.appendSpaceFor(t.length);for(let e=0;e<t.length;++e)this.view.setUint8(this.writePos++,t[e])}get Uint8Array(){return new Uint8Array(this.view.buffer,0,this.writePos)}}const h=2**53;class c{constructor(t,e){this.stream=t,this.tagger=e||new r}writeTypeAndArgument(t,e){e<24?this.stream.writeUint8(t<<5|e):e<256?(this.stream.writeUint8(t<<5|24),this.stream.writeUint8(e)):e<65536?(this.stream.writeUint8(t<<5|25),this.stream.writeUint16(e)):e<4294967296?(this.stream.writeUint8(t<<5|26),this.stream.writeUint32(e)):(this.stream.writeUint8(t<<5|27),this.stream.writeUint64(e))}writeTag(t){this.writeTypeAndArgument(6,t)}encodeItem(t){if(!1===t)return void this.stream.writeUint8(244);if(!0===t)return void this.stream.writeUint8(245);if(null===t)return void this.stream.writeUint8(246);if(void 0===t)return void this.stream.writeUint8(247);switch(typeof t){case"number":if(Math.floor(t)===t){if(0<=t&&t<=h)return void this.writeTypeAndArgument(0,t);if(-h<=t&&t<0)return void this.writeTypeAndArgument(1,-(t+1))}return this.stream.writeUint8(251),void this.stream.writeFloat64(t);case"string":{const e=(new TextEncoder).encode(t);this.writeTypeAndArgument(3,e.length),this.stream.writeUint8Array(e)}return;case"function":throw Error("Can't CBOR function")}if(t instanceof Date)return this.writeTag(1),void this.encodeItem(t.getTime());if(void 0===(t=this.tagger.encode(t,this)))return;if(Array.isArray(t)){this.writeTypeAndArgument(4,t.length);for(let e=0;e<t.length;++e)this.encodeItem(t[e]);return}if(t instanceof Uint8Array)return this.writeTypeAndArgument(2,t.length),void this.stream.writeUint8Array(t);const e=Object.keys(t).filter((t=>void 0!==this.tagger.encodeKey(t,this))),r=e.length;this.writeTypeAndArgument(5,r);for(const r of e)this.encodeItem(this.tagger.encodeKey(r,this)),this.encodeItem(t[r])}encodes(t){this.tagger.startEncoding(this),this.encodeItem(t),this.tagger.finishEncoding(this)}static encode(t,e,r){const i=new d,s=new c(i,e);return s.debug=r,s.encodes(t),i.Uint8Array}}const u=t=>class extends t{constructor(t){super(t),this.typeMap=this.options.typeMap||{},this.pendingProto=void 0}encode(t,e){let r=t.constructor;for(;r&&"Object"!==r.name;){if(this.typeMap[r.name]){e.writeTag(25443),e.encodeItem(r.name),e.debug&&e.debug(`\t'${t.constructor.name}' marked as ${r.name}`);break}r=Object.getPrototypeOf(r)}return super.encode(t,e)}decode(t,e){if(25443!==t)return super.decode(t,e);{const t=e.decodeItem();e.debug&&e.debug("Tag: CN",t);const r=this.typeMap[t];if(!r)throw Error(`${t} missing from type map`);this.pendingProto=r.prototype}}createObject(t){let e;return this.pendingProto?(e=Object.create(this.pendingProto),this.pendingProto=void 0):e=super.createObject(t),e}},w=new RegExp("^ആଈ(.+)$"),g="ρѓσςεรຂεϑ",m=t=>class extends t{constructor(t){super(t),this.k2i={},this.i2k=[],this.options.keys&&this.options.keys.forEach((t=>{this.k2i[t]=this.i2k.length,this.i2k.push(t)})),this.i2k_added=[]}finishEncoding(t){super.finishEncoding(t),t.encodeItem(this.i2k_added)}finishDecoding(t,e){super.finishDecoding(t,e),this.i2k_added=t.decodeItem(),this.options.debug&&this.options.debug(`Read ${this.i2k_added.length} added keys`),function(t,e){const r=[];!function t(i){if("object"==typeof i&&null!==i){if(Array.isArray(i)){for(const e of i)t(e);return}if(i[g])return;r.push(i),i[g]=!0;const s=Object.keys(i);for(const r of s){t(i[r]);const s=w.exec(r);s&&(i[e[s[1]]]=i[r],delete i[r])}}}(t);for(const t of r)delete t[g]}(e,[...this.i2k,...this.i2k_added])}encodeKey(t,e){if(void 0===super.encodeKey(t,this))return void(this.options.debug&&this.options.debug(`\tKDh ignore ${t}`));if(!this.i2k)return t;let r=this.k2i[t];return void 0===r&&(this.k2i[t]=r=this.i2k.length+this.i2k_added.length,this.options.added&&this.options.added(t,r),this.i2k_added.push(t)),r}decodeKey(t,e){return t<this.i2k.length?this.i2k[t]:`ആଈ${t}`}},f="_Í",l=t=>class extends t{constructor(t){super(t),this.objectsFrozen=[],this.objectsThawed={},this.currentID=void 0}finishDecoding(t,e){super.finishDecoding(t,e),this.objectsThawed={}}finishEncoding(t){super.finishEncoding(t);for(const t of this.objectsFrozen)delete t[f];this.objectsFrozen=[]}encode(t,e){if("object"==typeof t){if(void 0!==t[f])return e.writeTag(25442),void e.encodeItem(t[f]);const r=this.objectsFrozen.length;e.writeTag(25444),e.encodeItem(r),t[f]=r,this.objectsFrozen.push(t)}return super.encode(t,e)}decode(t,e){let r,i;switch(t){case 25444:return this.currentID=r=e.decodeItem(),e.debug&&e.debug("\tIDREF: ID=",r),e.decodeItem();case 25442:if(i=e.decodeItem(),e.debug&&e.debug("\tIDREF: REF to",i),!this.objectsThawed[i])throw Error(`Reference to unthawed ${i}`);return this.objectsThawed[i]}return super.decode(t,e)}createArray(t){const e=super.createArray(t);return void 0!==this.currentID&&(this.objectsThawed[this.currentID]=e,t.debug&&t.debug("\tIDREF: created []",this.currentID),this.currentID=void 0),e}createObject(t,e){const r=super.createObject(t,e);return void 0!==this.currentID&&(this.objectsThawed[this.currentID]=r,t.debug&&t.debug("\tIDREF: created {}",this.currentID),this.currentID=void 0),r}};var p=e.rK,b=e.Fv,y=e.h,U=e.hm,I=e.P8,A=e.Ol,v=e.Zz,D=e.nr,P=e.fq,E=e.Vy;export{p as DataInStream,b as DataOutStream,y as Decoder,U as Encoder,I as IDREFHandler,A as KeyDictionaryHandler,v as MemoryInStream,D as MemoryOutStream,P as TagHandler,E as TypeMapHandler};