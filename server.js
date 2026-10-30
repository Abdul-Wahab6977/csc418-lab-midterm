const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const express = require('express');
const { createStore } = require('./src/store');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const REPORT_FILE = path.join(ROOT, 'test-report.json');
const store = createStore(path.join(ROOT, 'data', 'submissions.json'));

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(ROOT, 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/submissions', (req, res) => res.json(store.list()));

app.post('/api/submissions', (req, res) => {
  const result = store.add(req.body);
  res.status(result.ok ? 201 : 400).json(result);
});

// Latest test report written by `npm test`
app.get('/api/report', (req, res) => {
  if (!fs.existsSync(REPORT_FILE)) return res.status(404).json({ error: 'No report yet. Run the tests first.' });
  res.type('json').send(fs.readFileSync(REPORT_FILE, 'utf8'));
});

// "Run tests" button - runs the real test suite and returns the fresh report
app.post('/api/run-tests', (req, res) => {
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'run-tests.js'), '--no-send'], { cwd: ROOT });
  child.on('close', () => {
    if (!fs.existsSync(REPORT_FILE)) return res.status(500).json({ error: 'Test run produced no report.' });
    res.type('json').send(fs.readFileSync(REPORT_FILE, 'utf8'));
  });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Handly running at http://localhost:${PORT}`));
}

module.exports = app;
