const fs = require('fs');

const csvData = fs.readFileSync('scratch.csv', 'utf16le');
const lines = csvData.split('\n');

const excelApis = [];
for (let i = 0; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length >= 5) {
    const method = parts[3].trim().toUpperCase();
    if (['GET','POST','PUT','PATCH','DELETE'].includes(method)) {
      const name = parts[2].trim();
      const path = parts[4].trim();
      excelApis.push({ name, method, path });
    }
  }
}

const codeData = fs.readFileSync('constants/api.ts', 'utf8');

const codeEndpoints = [];
const regexString = /:\s*['"]([^'"]+)['"]/g;
let match;
while ((match = regexString.exec(codeData)) !== null) {
  codeEndpoints.push(match[1].toLowerCase());
}
const regexTemplate = /:\s*(?:\([^)]+\)\s*=>\s*)?`\${BASE_URL}(\/[^`]*)`/g;
while ((match = regexTemplate.exec(codeData)) !== null) {
  codeEndpoints.push(match[1].toLowerCase());
}

const missingApis = [];
const foundApis = [];

excelApis.forEach(api => {
  let searchPath = api.path.replace(/\{[^}]+\}/g, '{id}').replace(/:[a-zA-Z_]+/g, '{id}').toLowerCase();
  
  // We need to check if codeEndpoints has a path that matches
  let found = false;
  for (let codePath of codeEndpoints) {
      let normCodePath = codePath.replace(/\$\{[^}]+\}/g, '{id}').replace(/\/+/g, '/').toLowerCase();
      
      // Allow partial matches because of missing /api/ prefixes
      // e.g. /auth/login matches /api/auth/login
      if (normCodePath.endsWith(searchPath) || searchPath.endsWith(normCodePath)) {
          found = true;
          break;
      }
      
      // If the excel path is /api/family/member/{id}/reports and code is /api/api/family/member/{id}/reports
      if (normCodePath.replace('/api/api/', '/api/') === searchPath.replace('/api/api/', '/api/')) {
          found = true;
          break;
      }
  }
  
  if (!found) {
      missingApis.push(api);
  } else {
      foundApis.push(api);
  }
});

fs.writeFileSync('missing.txt', missingApis.map(a => `[${a.method}] ${a.path} (${a.name})`).join('\n'));
console.log("Missing count:", missingApis.length);
