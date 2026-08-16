const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

const PATTERNS = [
  /:\s*any\b/,
  /\bas\s+any\b/,
  /<\s*any\s*>/,
  /\bany\s*\[\s*\]/
];

function getTsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.expo' || entry.name === 'dist') {
      continue;
    }
    if (entry.isDirectory()) {
      results = results.concat(getTsFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      results.push(fullPath);
    }
  }
  return results;
}

let violationCount = 0;
const tsFiles = getTsFiles(srcDir);

console.log(`Scanning ${tsFiles.length} TypeScript files in src/ for 'any' types...`);

for (const filePath of tsFiles) {
  const relativePath = path.relative(projectRoot, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const pattern of PATTERNS) {
      if (pattern.test(line)) {
        console.error(`VIOLATION: ${relativePath}:${index + 1}: ${line.trim()}`);
        violationCount++;
        break;
      }
    }
  });
}

if (violationCount > 0) {
  console.error(`\nFound ${violationCount} 'any' type violation(s).`);
  process.exit(1);
} else {
  console.log(`\nSuccess: 0 'any' type violations found.`);
  process.exit(0);
}
