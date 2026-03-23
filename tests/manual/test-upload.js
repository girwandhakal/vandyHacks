const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '..', 'output');
const outputPath = path.join(outputDir, 'test-upload-results.json');

async function uploadDocument(content, filename, type) {
  const fileBlob = new Blob([content], { type: 'text/plain' });
  const formData = new FormData();
  formData.append("file", fileBlob, filename);
  formData.append("type", type);

  const res = await fetch("http://localhost:3000/api/documents", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data;
}

async function run() {
  const results = {};
  
  // Test 1: Invalid document (should be rejected)
  try {
    console.log("Uploading invalid document...");
    const invalidDoc = await uploadDocument(
      "1 cup flour, 2 eggs, 1 cup milk, mix well and bake at 350.", 
      "cake_recipe.csv", 
      "medical_bill"
    );
    results.invalidInitial = invalidDoc;
  } catch(e) { }
  
  // Test 2: Valid document
  try {
    console.log("Uploading valid document...");
    const validDoc = await uploadDocument(
      "ClearPath Provider: Dr. Smith. Date of Service: 2024-03-15. Total Charged: $500. Patient Responsibility: $50.", 
      "real_bill.csv", 
      "medical_bill"
    );
    results.validInitial = validDoc;
  } catch(e) { }

  console.log("Waiting 10 seconds for AI background parsing to finish...");
  await new Promise(r => setTimeout(r, 10000));

  // Check final status
  try {
    const checkRes = await fetch("http://localhost:3000/api/documents");
    const docs = await checkRes.json();
    
    // get top 2
    results.docs = docs.slice(0, 2);
  } catch(e) {}
  
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Wrote ${outputPath}`);
  console.log("Done checking!");
}
run();
