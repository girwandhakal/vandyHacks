const fs = require('fs');
async function run() {
  const results = {};
  
  try {
    const res = await fetch("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What is a deductible?" })
    });
    results.assistantStatus = res.status;
    results.assistantResponse = await res.json();
  } catch(e) { results.assistantError = e.message; }
  
  try {
    const fileContent = "ClearPath Medical Bill. Total amount: $500. Individual Deductible: $1500.";
    const fileBlob = new Blob([fileContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append("file", fileBlob, "dummy-bill.txt");
    const res2 = await fetch("http://localhost:3000/api/documents", {
      method: "POST",
      body: formData
    });
    results.documentStatus = res2.status;
    results.documentResponse = await res2.json();
  } catch(e) { results.documentError = e.message; }
  
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
}
run();
