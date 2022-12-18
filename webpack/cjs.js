import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  mode: "production",
  entry: `${__dirname}/../src/CBOR.js`,
  output: {
    filename: 'index.js',
    path: `${__dirname}/../dist/cjs`,
    globalObject: "this",
    library: {
      name: "cbor",
      type: "umd"
    }
  },
  resolve: {
    extensions: [ '.js' ]
  }
};

export default config;
