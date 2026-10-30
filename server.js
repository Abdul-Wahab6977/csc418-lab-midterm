const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const express = require('express');
const { createStore } = require('./src/store');

const PORT = process.env.PORT || 3000;
const ROOT = process.env.HANDLY_ROOT || __dirname;
const REPORT_FILE = path.join(ROOT, 'test-report.json');
const store = createStore(path.join(ROOT, 'data', 'submissions.json'));

// Git buttons only make sense on your own computer (inside the git repo).
// On a hosting service set DISABLE_GIT_ACTIONS=1.
const gitEnabled = () => !process.env.DISABLE_GIT_ACTIONS && fs.existsSync(path.join(ROOT, '.git'));

const app = express();
app.use(express.json({ limit: '50kb' }));

// CORS: lets the GitHub Pages frontend talk to a hosted backend.
// Git actions are deliberately NOT reachable cross-origin (see /api/defect).
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static(path.join(ROOT, 'public')));

/** Run a command without a shell; resolves with { code, out }. */
function run(cmd, args, timeoutMs = 90000) {
  return new Promise((resolve) => {
    let out = '';
    const child = spawn(cmd, args, { cwd: ROOT, windowsHide: true });
    const timer = setTimeout(() => { out += '\n[timed out]'; child.kill(); }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: 1, out: out + e.message }); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code: code == null ? 1 : code, out: out.trim() }); });
  });
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/info', async (req, res) => {
  let branch = null;
  if (gitEnabled()) branch = (await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], 10000)).out.split('\n')[0] || null;
  res.json({ git: gitEnabled(), branch });
});

app.get('/api/submissions', (req, res) => res.json(store.list()));

app.post('/api/submissions', (req, res) => {
  const result = store.add(req.body);
  res.status(result.ok ? 201 : 400).json(result);
});

app.delete('/api/submissions/:id', (req, res) => {
  const ok = store.remove(req.params.id);
  res.status(ok ? 200 : 404).json({ ok });
});

// Latest test report written by `npm test`
app.get('/api/report', (req, res) => {
  if (!fs.existsSync(REPORT_FILE)) return res.status(404).json({ error: 'No report yet. Run the tests first.' });
  res.type('json').send(fs.readFileSync(REPORT_FILE, 'utf8'));
});

// "Run Tests" button - runs the real test suite and returns the fresh report
app.post('/api/run-tests', async (req, res) => {
  const args = [path.join(ROOT, 'scripts', 'run-tests.js')];
  if (!req.body || !req.body.send) args.push('--no-send');
  await run(process.execPath, args);
  if (!fs.existsSync(REPORT_FILE)) return res.status(500).json({ error: 'Test run produced no report.' });
  res.type('json').send(fs.readFileSync(REPORT_FILE, 'utf8'));
});

// "Push Defect" / "Fix Defect and Push": edit the code, commit and push to GitHub.
let gitBusy = false;
app.post('/api/defect', async (req, res) => {
  // Same-origin only: a random website must never be able to push from your computer.
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ ok: false, error: 'Cross-origin request refused.' });
  if (!gitEnabled()) return res.status(403).json({ ok: false, error: 'Git actions are only available when running locally inside the git repository.' });
  const mode = req.body && req.body.mode;
  if (mode !== 'defect' && mode !== 'fix') return res.status(400).json({ ok: false, error: 'mode must be "defect" or "fix".' });
  if (gitBusy) return res.status(409).json({ ok: false, error: 'Another git action is still running.' });

  gitBusy = true;
  const steps = [];
  const step = async (label, cmd, args, timeout) => {
    const r = await run(cmd, args, timeout);
    steps.push({ label, ok: r.code === 0, output: r.out });
    return r.code === 0;
  };
  try {
    const message = mode === 'defect' ? 'Introduce defect' : 'Fix defect';
    const ok =
      (await step(mode === 'defect' ? 'Introduce the defect' : 'Fix the defect', process.execPath, [path.join(ROOT, 'scripts', 'toggle-defect.js'), mode === 'defect' ? 'on' : 'off'], 20000)) &&
      (await step('git commit', 'git', ['commit', '-am', message], 30000)) &&
      (await step('git push', 'git', ['push'], 90000));
    res.status(ok ? 200 : 500).json({ ok, message, steps });
  } finally {
    gitBusy = false;
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Handly running at http://localhost:${PORT}`));
}

module.exports = app;
