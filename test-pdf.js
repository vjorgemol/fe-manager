import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

async function run() {
  const buf = fs.readFileSync('package.json'); // not a pdf, let's see what it does
  try {
    const data = await pdfParse(buf);
    console.log(data.text);
  } catch (e) {
    console.error("PDF Parse error:", e.message);
  }
}
run();
