#!/usr/bin/env node
/* Demo helper: `npm run defect` breaks the registration-number check, `npm run fix` restores it. */
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'public', 'validation.js');
const mode = process.argv[2];
const src = fs.readFileSync(file, 'utf8');
const re = /const REQUIRE_REG_NO = (true|false);/;

if (!re.test(src) || !['on', 'off'].includes(mode)) {
  console.error('Usage: node scripts/toggle-defect.js on|off');
  process.exit(1);
}
fs.writeFileSync(file, src.replace(re, `const REQUIRE_REG_NO = ${mode === 'on' ? 'false' : 'true'};`));
console.log(mode === 'on'
  ? 'Defect introduced: registration number is no longer required. Now commit and push.'
  : 'Defect fixed: registration number is required again. Now commit and push.');
