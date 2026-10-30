const fs = require('fs');
const raw = fs.existsSync('jest-results.json')
  ? JSON.parse(fs.readFileSync('jest-results.json', 'utf8')) : null;

const tests = [];
if (raw) for (const f of raw.testResults) for (const t of f.assertionResults)
  tests.push({
    name: t.fullName,
    result: t.status === 'passed' ? 'passed' : 'failed',
    failureMessage: t.failureMessages.length ? t.failureMessages.join('\n') : null
  });

const passed = tests.filter(t => t.result === 'passed').length;
const failed = tests.length - passed;

const report = {
  repository: process.env.GITHUB_REPOSITORY,
  branch: process.env.GITHUB_REF_NAME,
  commitSha: process.env.GITHUB_SHA,
  runId: process.env.GITHUB_RUN_ID,
  timestamp: new Date().toISOString(),
  tests,
  total: tests.length,
  passed,
  failed,
  status: raw && tests.length > 0 && failed === 0 ? 'passed' : 'failed'
};
fetch('http://localhost:4000/receive-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(report)
}).then(r => console.log('Receiver status:', r.status))
  .catch(e => { console.error('Send failed:', e.message); process.exit(1); });