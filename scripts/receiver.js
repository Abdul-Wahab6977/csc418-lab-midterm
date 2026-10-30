#!/usr/bin/env node
/*
 * Local report receiver.
 *   POST /report  ->  saves the JSON body as test-report.json on this computer.
 *
 * Start it with `npm run receiver`, then expose it to GitHub with a tunnel
 * (see README), e.g. `ngrok http 4000` or `cloudflared tunnel --url http://localhost:4000`.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.RECEIVER_PORT || 4000;
const TARGET = path.join(process.env.RECEIVER_DIR || process.cwd(), 'test-report.json');

const server = http.createServer((req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(obj));
  };

  if (req.method === 'GET' && req.url === '/') return send(200, { ok: true, service: 'handly-receiver' });
  if (req.method !== 'POST' || req.url !== '/report') return send(404, { error: 'Not found' });

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy();
  });
  req.on('end', () => {
    let report;
    try {
      report = JSON.parse(body);
    } catch (e) {
      return send(400, { error: 'Body is not valid JSON' });
    }
    if (!report || !report.summary || !Array.isArray(report.tests)) {
      return send(422, { error: 'Not a test report (needs summary and tests)' });
    }
    fs.writeFileSync(TARGET, JSON.stringify(report, null, 2));
    const s = report.summary;
    console.log(`[${new Date().toLocaleTimeString()}] report saved -> ${TARGET}  |  ${String(s.status).toUpperCase()}  ${s.passed}/${s.total}  commit ${String(report.commitSha).slice(0, 7)}`);
    send(200, { saved: true, file: 'test-report.json' });
  });
});

server.listen(PORT, () => {
  console.log(`Receiver listening on http://localhost:${PORT}/report`);
  console.log(`Reports are saved to ${TARGET}`);
});
