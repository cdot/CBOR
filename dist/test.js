const { Encoder, Decoder } = require("./index.js");

const data = [ "Sponge", "Tunicate", "Bryozoan" ];
const frozen = Encoder.encode(data);
const thawed = Decoder.decode(frozen);
console.log(thawed);

