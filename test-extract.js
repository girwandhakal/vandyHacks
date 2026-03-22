const fs = require('fs');
const pdf = require('pdf-parse');

async function extract() {
  try {
    const buffer = fs.readFileSync('ISO_Care_2025_2026_A.pdf');
    const data = await pdf(buffer);
    console.log("Extraction length:", data.text.length);
    console.log("Snippet:", data.text.substring(0, 500));
  } catch (err) {
    console.error("PDF extraction error:", err);
  }
}
extract();
