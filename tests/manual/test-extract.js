const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const samplePdfPath = path.resolve(__dirname, '..', '..', 'dummy_data', 'ISO_Care_2025_2026_A.pdf');

async function extract() {
  try {
    const buffer = fs.readFileSync(samplePdfPath);
    const data = await pdf(buffer);
    console.log("Extraction length:", data.text.length);
    console.log("Snippet:", data.text.substring(0, 500));
  } catch (err) {
    console.error("PDF extraction error:", err);
  }
}
extract();
