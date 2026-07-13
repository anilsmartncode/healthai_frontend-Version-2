const fs = require('fs');

// Read the CSV to get Excel APIs
const csvData = fs.readFileSync('scratch.csv', 'utf16le');
const excelPaths = csvData.toLowerCase();

// Read api.ts
const codeData = fs.readFileSync('constants/api.ts', 'utf8');

// Use a regex to find all endpoint paths in api.ts
// E.g. `${BASE_URL}/api/auth/login` or `'/api/ai/chat'`
const codeEndpoints = [];

// Match strings like '/api/ai/chat'
const regexString = /:\s*['"](\/[^'"]+)['"]/g;
let match;
while ((match = regexString.exec(codeData)) !== null) {
  codeEndpoints.push(match[1]);
}

// Match template literals like `${BASE_URL}/api/reports/${id}`
const regexTemplate = /:\s*(?:\([^)]+\)\s*=>\s*)?`\${BASE_URL}(\/[^`]*)`/g;
while ((match = regexTemplate.exec(codeData)) !== null) {
  codeEndpoints.push(match[1]);
}

const missingInExcel = [];

codeEndpoints.forEach(endpoint => {
  // endpoint might be /api/api/family/member/${id}/health-summary
  // clean it up for searching
  let searchPath = endpoint.replace(/\$\{[^}]+\}/g, '').replace(/\/+/g, '/').toLowerCase();
  
  // Try to find parts of the search path in the CSV
  const tokens = searchPath.split('/').filter(p => p && p !== 'api');
  if (tokens.length === 0) return;
  
  const lastTwoTokens = tokens.slice(-2).join('/');
  const lastToken = tokens[tokens.length - 1];
  
  // If neither the last two tokens nor the last token exist in the excel sheet text, it's missing
  if (!excelPaths.includes(lastTwoTokens) && !excelPaths.includes(lastToken)) {
      missingInExcel.push(endpoint);
  }
});

console.log("Total APIs in Code:", codeEndpoints.length);
console.log("Missing APIs in Excel sheet:");
// Deduplicate
const uniqueMissing = [...new Set(missingInExcel)];
uniqueMissing.forEach(api => {
    console.log(`- ${api}`);
});
