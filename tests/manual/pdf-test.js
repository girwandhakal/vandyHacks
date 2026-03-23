const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');

async function test(filename) {
  try {
    const PdfParse = require('pdf-parse-new');
    const SmartParser = new PdfParse.SmartPDFParser();
    const buffer = fs.readFileSync(filename);
    const result = await SmartParser.parse(buffer);
    console.log(`\n=== ${filename} ===`);
    console.log(`Pages: ${result.numpages}, Method: ${result._meta?.method}, Duration: ${result._meta?.duration?.toFixed(0)}ms`);
    console.log(`Text length: ${result.text.length} chars`);
    console.log(`First 300 chars:\n${result.text.substring(0, 300)}`);
  } catch(err) {
    console.error(`\n=== ${filename} ERROR ===`);
    console.error(err.message);
  }
}

async function run() {
  await test(path.join(projectRoot, 'dummy_data', 'ISO_Care_2025_2026_A.pdf'));
  await test(path.join(projectRoot, 'dummy_data', 'reference-pdfs', 'download.pdf'));
}
run();
