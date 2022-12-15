/* eslint-env node, mocha, browser */

import { MemoryInStream } from "../src/MemoryInStream.mjs";
import { MemoryOutStream } from "../src/MemoryOutStream.mjs";
import { Encoder } from "../src/Encoder.mjs";
import { Decoder } from "../src/Decoder.mjs";

describe("CBOR Encode/Decode - no tags", () => {

  // This clumsiness is because we want to run these tests in the browser,
  // which can't resolve node_modules
  let assert;
  before(done => {
    if (typeof chai === "undefined") {
      import("chai")
      .then(chai => {
        assert = chai.assert;
        done();
      });
    }
    else {
      assert = chai.assert;
      done();
    }
  });

  function UNit() {}

  function hex2data(hex) {
    var length = hex.length / 2;
    var data = new Uint8Array(length);
    for (let i = 0; i < length; i++)
      data[i] = parseInt(hex.substr(i * 2, 2), 16);
    return data;
  }

  function data2hex(data) {
    if (data instanceof ArrayBuffer)
      return data2hex(new Uint8Array(data));
    let hex = "";
    for (var i = 0; i < data.length; ++i)
      hex += (data[i] < 0x10 ? "0" : "") + data[i].toString(16);
    return hex;
  }

  // test vectors from https://github.com/cbor/test-vectors/
  // These all assume no tagger.
  // Note that the encoder is specific to Javascript and won't generate
  // some of the CBOR types. Specifically it won't generate:
  // * short (16 and 32 bit) floats
  // * indefinite arrays
  // * bigints
  // Fields are:
  // name: name of the testcase
  // hex: hex representation of the CBOR input
  // expect: value expected when hex is decoded
  // roundtrip: whether re-encoding expect should regenerate hex
  const testcases = [
    {
      name: "PositiveIntegerFix 0",
      hex: "00",
      expect: 0,
      roundtrip: true
    },
    {
      name: "PositiveIntegerFix 1",
      hex: "01",
      expect: 1,
      roundtrip: true
    },
    {
      name: "PositiveIntegerFix 10",
      hex: "0a",
      expect: 10,
      roundtrip: true
    },
    {
      name: "PositiveIntegerFix 23",
      hex: "17",
      expect: 23,
      roundtrip: true
    },
    {
      name: "PositiveIntegerFix 24",
      hex: "1818",
      expect: 24,
      roundtrip: true
    },
    {
      name: "PositiveInteger8 25",
      hex: "1819",
      expect: 25,
      roundtrip: true
    },
    {
      name: "PositiveInteger8 100",
      hex: "1864",
      expect: 100,
      roundtrip: true
    },
    {
      name: "PositiveInteger16 1000",
      hex: "1903e8",
      expect: 1000,
      roundtrip: true
    },
    {
      name: "PositiveInteger32 1000000",
      hex: "1a000f4240",
      expect: 1000000,
      roundtrip: true
    },
    {
      name: "PositiveInteger64 1000000000000",
      hex: "1b000000e8d4a51000",
      expect: 1000000000000,
      roundtrip: true
    },
    {
      name: "PositiveInteger64 9007199254740991",
      hex: "1b001fffffffffffff",
      roundtrip: true,
      expect: 9007199254740991
    },

    {
      name: "PositiveInteger64 9007199254740992",
      hex: "1b0020000000000000",
      roundtrip: true,
      expect: 9007199254740992
    },

    {
      name: "PositiveInteger64 2^64-1",
      hex: "1bffffffffffffffff",
      expect: 18446744073709551615
    },
    {
      name: "NegativeIntegerFix -1",
      hex: "20",
      roundtrip: true,
      expect: -1
    },
    {
      name: "NegativeIntegerFix -10",
      hex: "29",
      roundtrip: true,
      expect: -10
    },
    {
      name: "NegativeIntegerFix -24",
      hex: "37",
      roundtrip: true,
      expect: -24
    },
    {
      name: "NegativeInteger8 -25",
      hex: "3818",
      roundtrip: true,
      expect: -25
    },
    {
      name: "NegativeInteger8 -26",
      hex: "3819",
      roundtrip: true,
      expect: -26
    },
    {
      name: "NegativeInteger8 -100",
      hex: "3863",
      roundtrip: true,
      expect: -100
    },
    {
      name: "NegativeInteger16 -1000",
      hex: "3903e7",
      roundtrip: true,
      expect: -1000
    },
    {
      name: "NegativeInteger32 -1000000",
      hex: "3a000f423f",
      roundtrip: true,
      expect: -1000000
    },
    {
      name: "NegativeInteger64 -1000000000000",
      hex: "3b000000e8d4a50fff",
      expect: -1000000000000
    },
    {
      name: "NegativeInteger64 -9007199254740992",
      hex: "3b001fffffffffffff",
      expect: -9007199254740992
    },
    {
      name: "NegativeInteger64 -18446744073709551616",
      hex: "3bffffffffffffffff",
      expect: -18446744073709551616
    },
    {
      name: "ByteString []",
      hex: "40",
      roundtrip: true,
      expect: new Uint8Array([])
    },
    {
      name: "Bytestring [1,2,3,4]",
      hex: "4401020304",
      roundtrip: true,
      expect: new Uint8Array([1,2,3,4])
    },
    {
      name: "Bytestring [1,2,3,4,5]",
      hex: "5f42010243030405ff",
      expect: new Uint8Array([1,2,3,4,5])
    },
    {
      name: "String ''",
      hex: "60",
      roundtrip: true,
      expect: ""
    },
    {
      name: "String 'a'",
      hex: "6161",
      roundtrip: true,
      expect: "a"
    },
    {
      name: "String 'IETF'",
      hex: "6449455446",
      roundtrip: true,
      expect: "IETF"
    },
    {
      name: "String '\"\\'",
      hex: "62225c",
      roundtrip: true,
      expect: "\"\\"
    },
    {
      name: "String '\u00fc' (U+00FC)",
      hex: "62c3bc",
      roundtrip: true,
      expect: "\u00fc"
    },
    {
      name: "String '\u6c34' (U+6C34)",
      hex: "63e6b0b4",
      roundtrip: true,
      expect: "\u6c34"
    },
    {
      name: "String '\ud800\udd51' (U+10151)",
      hex: "64f0908591",
      roundtrip: true,
      expect: "\ud800\udd51"
    },
    {
      name: "String 'streaming'",
      hex: "7f657374726561646d696e67ff",
      expect: "streaming"
    },
    {
      name: "Array []",
      hex: "80",
      roundtrip: true,
      expect: []
    },
    {
      name: "Array ['a', {'b': 'c'}]",
      hex: "826161a161626163",
      expect: ["a", {b: "c"}]
    },
    {
      name: "Array ['a, {_ 'b': 'c'}]",
      hex: "826161bf61626163ff",
      expect: ["a", {"b": "c"}]
    },
    {
      name: "Array [1,2,3]",
      hex: "83010203",
      roundtrip: true,
      expect: [1, 2, 3]
    },
    {
      name: "Array [1, [2, 3], [4, 5]]",
      hex: "8301820203820405",
      roundtrip: true,
      expect: [1, [2, 3], [4, 5]]
    },
    {
      name: "Array [1, [2, 3], [_ 4, 5]]",
      hex: "83018202039f0405ff",
      expect: [1, [2, 3], [4, 5]]
    },
    {
      name: "Array [1, [_ 2, 3], [4, 5]]",
      hex: "83019f0203ff820405",
      expect: [1, [2, 3], [4, 5]]
    },
    {
      name: "Array [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]",
      hex: "98190102030405060708090a0b0c0d0e0f101112131415161718181819",
      roundtrip: true,
      expect: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    },
    {
      name: "Array [_ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]",
      hex: "9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff",
      expect: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    },
    {
      name: "Array [_ 1, [2, 3], [4, 5]]",
      hex: "9f01820203820405ff",
      expect: [1, [2, 3], [4, 5]]
    },
    {
      name: "Array [_ 1, [2, 3], [_ 4, 5]]",
      hex: "9f018202039f0405ffff",
      expect: [1, [2, 3], [4, 5]]
    },
    {
      name: "Array [_ ]",
      hex: "9fff",
      expect: []
    },
    {
      name: "Object {}",
      hex: "a0",
      roundtrip: true,
      expect: {}
    },
    {
      name: "Object {1: 2, 3: 4}",
      hex: "a201020304",
      expect: {1: 2, 3: 4}
    },
    {
      name: "Object {'a': 1, 'b': [2, 3]}",
      hex: "a26161016162820203",
      roundtrip: true,
      expect: {"a": 1, "b": [2, 3]}
    },
    {
      name: "Object {'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E'}",
      roundtrip: true,
      hex: "a56161614161626142616361436164614461656145",
      expect: {"a": "A", "b": "B", "c": "C", "d": "D", "e": "E"}
    },
    {
      name: "Object {_ 'a': 1, 'b': [_ 2, 3]}",
      hex: "bf61610161629f0203ffff",
      expect: {"a": 1, "b": [2, 3]}
    },
    {
      name: "Object {_ 'Fun': true, 'Amt': -2}",
      hex: "bf6346756ef563416d7421ff",
      expect: {"Fun": true, "Amt": -2}
    },
    {
      name: "Tag Self-describe CBOR 0",
      hex: "d9d9f700",
      expect: 0
    },
    {
      name: "false",
      roundtrip: true,
      hex: "f4",
      expect: false
    },
    {
      name: "true",
      hex: "f5",
      roundtrip: true,
      expect: true
    },
    {
      name: "null",
      hex: "f6",
      roundtrip: true,
      expect: null
    },
    {
      name: "undefined",
      hex: "f7",
      roundtrip: true,
      expect: undefined
    },
    {
      name: "UnassignedSimpleValue 255",
      hex: "f8ff",
      expect: 255
    },
    {
      name: "Float16 0.0",
      hex: "f90000",
      expect: 0.0
    },
    {
      name: "Float16 -0.0",
      hex: "f98000",
      expect: -0.0
    },
    {
      name: "Float16 1.0",
      hex: "f93c00",
      expect: 1.0
    },
    {
      name: "Float16 1.5",
      hex: "f93e00",
      expect: 1.5
    },
    {
      name: "Float16 65504.0",
      hex: "f97bff",
      expect: 65504.0
    },
    {
      name: "Float16 5.960464477539063e-8",
      hex: "f90001",
      expect: 5.960464477539063e-8
    },
    {
      name: "Float16 0.00006103515625",
      hex: "f90400",
      expect: 0.00006103515625
    },
    {
      name: "Float16 -5.960464477539063e-8",
      hex: "f98001",
      expect: -5.960464477539063e-8
    },
    {
      name: "Float16 -4.0",
      hex: "f9c400",
      expect: -4.0
    },
    {
      name: "Float16 +Infinity",
      hex: "f97c00",
      expect: Infinity
    },
    {
      name: "Float16 NaN",
      hex: "f97e00",
      expect: NaN
    },
    {
      name: "Float16 -Infinity",
      hex: "f9fc00",
      expect: -Infinity
    },
    {
      name: "Float32 100000.0",
      hex: "fa47c35000",
      expect: 100000.0
    },
    {
      name: "Float32 3.4028234663852886e+38",
      hex: "fa7f7fffff",
      expect: 3.4028234663852886e+38
    },
    {
      name: "Float32 +Infinity",
      hex: "fa7f800000",
      expect: Infinity
    },
    {
      name: "Float32 NaN",
      hex: "fa7fc00000",
      expect: NaN
    },
    {
      name: "Float32 -Infinity",
      hex: "faff800000",
      expect: -Infinity
    },
    {
      name: "Float64 1.1",
      roundtrip: true,
      hex: "fb3ff199999999999a",
      expect: 1.1
    },
    {
      name: "Float64 9007199254740994",
      hex: "fb4340000000000001",
      expect: 9007199254740994
    },
    {
      name: "Float64 1.0e+300",
      hex: "fb7e37e43c8800759c",
      expect: 1.0e+300
    },
    {
      name: "Float64 -4.1",
      hex: "fbc010666666666666",
      expect: -4.1
    },
    {
      name: "Float64 -9007199254740994",
      hex: "fbc340000000000001",
      expect: -9007199254740994
    },
    {
      name: "Float64 +Infinity",
      hex: "fb7ff0000000000000",
      expect: Infinity
    },
    {
      name: "Float64 NaN",
      hex: "fb7ff8000000000000",
      expect: NaN
    },
    {
      name: "Float64 -Infinity",
      hex: "fbfff0000000000000",
      expect: -Infinity
    },
    { hex: "f0", expect: 16, name: 'simple(16)' },
    { hex: "f818", expect: 24, name: 'simple(24)' }
  ];

  testcases.forEach(tc => {
    const testcase = tc;

    it("basic " + `${testcase.name} ${testcase.hex}`, () => {
      const cbor = hex2data(testcase.hex);
      const decoded = Decoder.decode(cbor);
      assert.deepEqual(decoded, testcase.expect);

      if (testcase.roundtrip) {
        const reencoded = Encoder.encode(decoded);
        assert.deepEqual(
          reencoded, cbor,
          `\n${data2hex(reencoded)}\n!=\n${data2hex(cbor)}`);
      }
    });
  });

  it("Big Array", () => {
    const value = new Array(0x10001);
    for (var i = 0; i < value.length; ++i)
      value[i] = i;
    const outs = new MemoryOutStream();
    new Encoder(outs).encodes(value);
    const encoded = outs.Uint8Array;
    const decoded = new Decoder(new MemoryInStream(encoded)).decodes();
    assert.deepEqual(decoded, value);
  });

  it("Invalid ai 30 for type 0", () => {
    try {
      Decoder.decode(hex2data("1e"));
      assert.fail("exception expected");
    } catch (e) {
      assert.equal(e.message, "Malformed 0 30");
    }
  });

  it("Invalid ai 30 for type 1", () => {
    try {
      Decoder.decode(hex2data("3e"));
      assert.fail("exception expected");
    } catch (e) {
      assert.equal(e.message, "Malformed 1 30");
    }
  });

  it("Invalid ai 31 for type 0", () => {
    try {
      // 1f = major type 0, ai = 31
      Decoder.decode(hex2data("1f"));
      assert.fail("exception expected");
    } catch (e) {
      assert.equal(e.message, "Malformed 0 31");
    }
  });

  it("Invalid indefinite length element type", () => {
    try {
      Decoder.decode(hex2data("5f00"));
      assert.fail("exception expected");
    } catch (e) {
      assert.equal(e.message, "Major type mismatch on chunk 0!=2");
    }
  });

  it("Invalid indefinite length element length", () => {
    var threw = false;
    try {
      // This encodes a zero-length chunk, which is permitted by the spec
      Decoder.decode(hex2data("5f5f"));
    } catch (e) {
      threw = e;
    }

    assert(!threw, "Thrown exception");
  });

  it("simple-object", () => {

    let simple = {
      number: 10,
      string: 'String',
      date: new Date(1234567890123),
      array: [ 1, 2, 3 ],
      object: { data: 'lorem ipsum' }
    };

    let frozen = Encoder.encode(simple);
    let thawed = Decoder.decode(frozen);
    assert.deepEqual(thawed, simple);
  });
});
