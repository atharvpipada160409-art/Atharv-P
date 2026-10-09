const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const target = path.join(distDir, 'index.js');
const content = `// Auto-generated entrypoint bridge for Render / deployment hosts
require('./server/src/index.js');
`;

fs.writeFileSync(target, content, 'utf8');
console.log('✓ Successfully created dist/index.js entrypoint bridge');
