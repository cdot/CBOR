import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  mode: "production",
  entry: `${__dirname}/src/index.js`,
  output: {
    filename: 'index.js',
    path: `${__dirname}/dist`,
    globalObject: "this",
    library: {
      name: "CBOR",
      type: "umd"
    }
  },
  resolve: {
    extensions: [ '.mjs' ]
  }
};

export default config;
