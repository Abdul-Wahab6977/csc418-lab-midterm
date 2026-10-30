#!/usr/bin/env node
/*
 * Runs the real test suite (node:test), writes test-report.json and
 * (unless --no-send) POSTs the report to the local receiver.
 *
 *   REPORT_URL   where to send the report (default http://localhost:4000/report).
 *                In CI this is the public tunnel URL that points at your receiver.
 *
 * Exit code is 1 when any test fails, so the CI "test" stage fails properly.
 */
const path = require('node:path');
const fs = require('node:fs');
const { run } = require('node:test');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'test-report.json');
const SUMMARY = path.join(ROOT, 'test-summary.txt');
const send = !process.argv.includes('--no-send');

const tests = [];

function eventToTest(data) {
  // ignore file-level wrappers; only count the tests we wrote
  if (data.nesting !== 0 || data.name.endsWith('.test.js')) return null;
  return data;
}

const stream = run({ files: [path.join(ROOT, 'test', 'portal.test.js')], concurrency: false });

stream.on('test:pass', (d) => {
  const t = eventToTest(d);
  if (t) tests.push({ name: t.name, result: 'pass', durationMs: Math.round(t.details.duration_ms), failureMessage: null });
});
stream.on('test:fail', (d) => {
  const t = eventToTest(d);
  if (!t) return;
  const err = t.details.error;
  const c = (err && err.cause) || err || {};
  let msg = String(c.message || 'Test failed').split('\n')[0];
  if (c.generatedMessage && 'expected' in c) msg = `${msg} expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.actual)}`;
  if (msg.length > 200) msg = msg.slice(0, 197) + '...';
  tests.push({ name: t.name, result: 'fail', durationMs: Math.round(t.details.duration_ms), failureMessage: msg });
});

stream.resume(); // keep the stream flowing so 'end' fires
stream.on('end', async () => {
  const passed = tests.filter((t) => t.result === 'pass').length;
  const failed = tests.length - passed;
  const env = process.env;

  const report = {
    repository: env.GITHUB_REPOSITORY || 'local/csc418-lab-midterm',
    branch: env.GITHUB_REF_NAME || 'local',
    commitSha: env.GITHUB_SHA || 'local',
    pipelineRunId: env.GITHUB_RUN_ID || 'local',
    runNumber: env.GITHUB_RUN_NUMBER || null,
    runUrl: env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}` : null,
    timestamp: new Date().toISOString(),
    summary: { total: tests.length, passed, failed, status: tests.length > 0 && failed === 0 ? 'passed' : 'failed' },
    tests,
  };

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

  const lines = [
    `Repository : ${report.repository}`,
    `Branch     : ${report.branch}`,
    `Commit     : ${report.commitSha}`,
    `Run        : ${report.pipelineRunId}`,
    `Time       : ${report.timestamp}`,
    `Result     : ${report.summary.status.toUpperCase()}  (${passed}/${tests.length} passed, ${failed} failed)`,
    '',
    ...tests.map((t) => `${t.result === 'pass' ? 'PASS' : 'FAIL'}  ${t.name}${t.failureMessage ? '\n      -> ' + t.failureMessage : ''}`),
  ];
  fs.writeFileSync(SUMMARY, lines.join('\n') + '\n');
  console.log(lines.join('\n'));

  if (send) {
    const url = process.env.REPORT_URL || 'http://localhost:4000/report';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify(report),
        signal: AbortSignal.timeout(15000),
      });
      console.log(`\nReport sent to ${url} -> HTTP ${res.status}`);
    } catch (e) {
      // Delivery problems must not hide the real test result.
      console.log(`\nCould not deliver report to ${url}: ${e.message}`);
    }
  }

  process.exitCode = failed > 0 || tests.length === 0 ? 1 : 0;
});
