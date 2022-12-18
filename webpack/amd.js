import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  mode: "production",
  entry: `${__dirname}/../src/CBOR.js`,
  output: {
    filename: 'cbor.js',
    path: `${__dirname}/../dist/amd`,
    globalObject: "this",
    library: {
      name: "cbor",
      type: "amd"
    }
  },
  resolve: {
    extensions: [ '.js' ]
  }
};

export default config;
