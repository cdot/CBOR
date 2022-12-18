import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  mode: "production",
  entry: `${__dirname}/../src/CBOR.js`,
  experiments: {
    outputModule: true
  },
  output: {
    filename: 'index.js',
    path: `${__dirname}/../dist/mjs`,
    globalObject: "this",
    library: {
      type: "module"
    }
  },
  resolve: {
    extensions: [ '.js' ]
  }
};

export default config;
