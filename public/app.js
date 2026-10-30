/* Handly front-end.
 * Two modes, picked automatically:
 *   api    - served by server.js: submissions go to the server, "Run Tests" works, report comes from /api/report
 *   static - served from GitHub Pages: submissions live in this browser (localStorage), report comes from report.json
 */
(function () {
  'use strict';

  const V = window.HandlyValidation;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- icons ---------- */
  const ICONS = {
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    bug: '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    branch: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  function paintIcons(root) {
    $$('i[data-icon]', root).forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.icon); });
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- state ---------- */
  const state = { mode: 'static', submissions: [], report: null, running: false };
  const LS_KEY = 'handly-submissions';

  const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; } };
  const lsSet = (v) => { try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch (e) { /* private mode: keep in memory */ } };

  /* ---------- data ---------- */
  async function fetchJson(url, opts, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms || 4000);
    try {
      const r = await fetch(url, Object.assign({ signal: ctl.signal, cache: 'no-store' }, opts));
      if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; e.body = await r.json().catch(() => null); throw e; }
      return await r.json();
    } finally { clearTimeout(t); }
  }

  async function loadSubmissions() {
    if (state.mode === 'api') {
      try { state.submissions = await fetchJson('/api/submissions'); } catch (e) { state.submissions = []; }
    } else {
      state.submissions = lsGet().sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.seq - a.seq);
    }
  }

  async function loadReport() {
    try { state.report = await fetchJson(state.mode === 'api' ? '/api/report' : 'report.json'); }
    catch (e) { state.report = null; }
  }

  /* ---------- render: checks ---------- */
  function fmtTime(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function stepModel() {
    const r = state.report;
    const onPages = /github\.io$/.test(location.hostname);
    const passed = r && r.summary.status === 'passed';
    const failed = r && r.summary.status !== 'passed';
    return [
      { ic: 'upload', name: 'Saved', sub: state.submissions.length ? 'Submission stored' : 'Ready', st: state.submissions.length ? 'done' : '' },
      { ic: 'flask', name: 'Tests', sub: r ? `${r.summary.passed}/${r.summary.total} passed` : 'Not run yet', st: !r ? '' : passed ? 'done' : 'fail' },
      { ic: 'file', name: 'Report', sub: r ? (state.mode === 'api' ? 'Local report received' : 'Report published') : 'Waiting', st: r ? 'done' : '' },
      { ic: 'mail', name: 'Email', sub: 'Sent by CI', st: '' },
      { ic: 'globe', name: 'Deploy', sub: failed ? 'Blocked' : onPages ? 'Live on Pages' : 'On green push', st: failed ? 'fail' : onPages ? 'done' : '' },
    ];
  }

  function renderChecks() {
    const r = state.report;
    const s = r && r.summary;
    const passed = s && s.status === 'passed';

    // banner
    const banner = $('#banner');
    if (!r) {
      banner.className = 'banner';
      banner.innerHTML = `<span class="b-ic"><i data-icon="flask"></i></span>No test report yet. ${state.mode === 'api' ? 'Press “Run Tests”.' : 'Push to GitHub to create one.'}`;
    } else if (passed) {
      banner.className = 'banner ok';
      banner.innerHTML = '<span class="b-ic"><i data-icon="check"></i></span>SUCCESS! All tests passed.';
    } else {
      banner.className = 'banner bad';
      banner.innerHTML = `<span class="b-ic"><i data-icon="x"></i></span>${s.failed} test${s.failed === 1 ? '' : 's'} failed. Deploy is blocked.`;
    }

    // steps
    const stepsHtml = stepModel().map((m) =>
      `<div class="step ${m.st}"><span class="s-ic"><i data-icon="${m.ic}"></i></span><b>${m.name}</b><small>${esc(m.sub)}</small></div>`).join('');
    $('#steps').innerHTML = stepsHtml;
    $('#heroFlow').innerHTML = stepModel().map((m) =>
      `<div class="flow-step ${m.st}"><span class="flow-ic"><i data-icon="${m.ic}"></i></span>${m.name}</div>`).join('');

    // repo line, run row, commit line
    $('#repoLine').textContent = r ? `${r.repository} · ${r.branch}` : 'Waiting for the first test run';
    $('#runId').textContent = r ? `#${r.pipelineRunId}${r.runNumber ? ' · run ' + r.runNumber : ''} · ${fmtTime(r.timestamp)}` : '-';
    const link = $('#runLink');
    if (r && r.runUrl) { link.href = r.runUrl; link.hidden = false; } else link.hidden = true;
    $('#commitLine').innerHTML = r ? `<i data-icon="branch"></i> commit ${esc(String(r.commitSha).slice(0, 7))} · ${esc(r.branch)}` : '';

    // stats
    const pct = s && s.total ? Math.round((s.passed / s.total) * 100) : null;
    const ring = $('#ringFg');
    ring.style.stroke = !r ? 'var(--idle)' : passed ? 'var(--ok)' : 'var(--bad)';
    ring.style.strokeDasharray = `${pct == null ? 0 : pct} 100`;
    $('#ringPct').textContent = pct == null ? '-' : pct + '%';
    const st = $('#stStatus');
    st.textContent = !r ? 'Idle' : passed ? 'Success' : 'Failed';
    st.style.color = !r ? '' : passed ? 'var(--ok)' : 'var(--bad)';
    $('#stTotal').textContent = s ? s.total : '-';
    $('#stPassed').textContent = s ? s.passed : '-';
    $('#stFailed').textContent = s ? s.failed : '-';

    // table
    $('#rows').innerHTML = r && r.tests.length
      ? r.tests.map((t) => `<tr class="${t.result === 'fail' ? 'row-fail' : ''}"><td>${esc(t.name)}</td>
          <td class="res"><span class="res-pill ${t.result}">${t.result.toUpperCase()}</span></td>
          <td class="det">${t.failureMessage ? esc(t.failureMessage) : '–'}</td></tr>`).join('')
      : '<tr class="empty-row"><td colspan="3">No results yet.</td></tr>';

    // terminal
    const lines = r
      ? r.tests.map((t) => `<div class="tl"><span class="tag ${t.result}">${t.result.toUpperCase()}</span><span>${esc(t.name)}</span></div>`).join('') +
        `<div class="term-sum">${s.passed}/${s.total} passed · report saved${passed ? '' : ' · deploy blocked'}</div>`
      : '<div class="tl"><span class="tag wait">WAIT</span><span>no test run yet</span></div>';
    $('#termBody').innerHTML = '<div><span class="prompt">$</span> npm test</div>' + lines;

    // buttons / pills
    $('#runBtn').disabled = state.mode !== 'api' || state.running;
    $('#runBtn').innerHTML = `<i data-icon="play"></i> ${state.running ? 'Running…' : 'Run Tests'}`;
    $('#nextNote').textContent = state.mode === 'api'
      ? 'Click a command card to copy it. A failed version is never deployed.'
      : 'Demo mode: Run Tests works when the app runs locally (npm start). Click a command card to copy it.';
    $('#modePill').classList.toggle('on', state.mode === 'api');
    $('#modeText').textContent = state.mode === 'api' ? 'Connected' : 'Demo mode';

    paintIcons();
  }

  /* ---------- render: submissions ---------- */
  function renderList() {
    const n = state.submissions.length;
    $('#navCount').textContent = n;
    $('#listSub').textContent = n ? `${n} saved · latest first` : 'Latest first';
    $('#subs').innerHTML = n
      ? state.submissions.map((s) => `<li class="sub">
          <h4>${esc(s.title)}</h4><time datetime="${esc(s.createdAt)}">${esc(fmtTime(s.createdAt))}</time>
          <div class="meta"><b>${esc(s.studentName)}</b> · ${esc(s.regNo)}</div>
          <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a></li>`).join('')
      : '<li class="sub-empty">Nothing submitted yet. Your saved submissions will show up here.</li>';
  }

  /* ---------- form ---------- */
  const form = $('#form');
  const msg = $('#formMsg');

  function showErrors(errors) {
    ['studentName', 'regNo', 'title', 'url'].forEach((f) => {
      const wrap = $(`[data-err="${f}"]`).closest('.field');
      $(`[data-err="${f}"]`).textContent = errors[f] || '';
      wrap.classList.toggle('invalid', !!errors[f]);
    });
  }

  function say(text, kind) {
    msg.className = 'form-msg ' + (kind || '');
    msg.innerHTML = text ? `<i data-icon="${kind === 'ok' ? 'check' : 'x'}"></i> ${esc(text)}` : '';
    paintIcons(msg);
  }

  form.addEventListener('input', (e) => {
    const f = e.target.name;
    if (f) { const w = e.target.closest('.field'); w.classList.remove('invalid'); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    say('');
    const data = Object.fromEntries(new FormData(form).entries());
    const result = V.validateSubmission(data);
    showErrors(result.errors);
    if (!result.ok) { say('Please fix the highlighted fields.', 'bad'); return; }

    try {
      if (state.mode === 'api') {
        await fetchJson('/api/submissions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result.value) });
      } else {
        const all = lsGet();
        all.push(Object.assign({ id: String(Date.now()), seq: all.length + 1 }, result.value, { createdAt: new Date().toISOString() }));
        lsSet(all);
      }
    } catch (err) {
      if (err.body && err.body.errors) { showErrors(err.body.errors); say('The server rejected the submission.', 'bad'); }
      else say('Could not reach the server. Try again.', 'bad');
      return;
    }
    form.reset();
    say('Submission saved.', 'ok');
    await loadSubmissions();
    renderList();
    renderChecks();
  });

  /* ---------- actions ---------- */
  function toast(text) {
    const t = $('#toast');
    t.textContent = text; t.classList.add('show');
    clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 1800);
  }

  $('#runBtn').addEventListener('click', async () => {
    if (state.mode !== 'api' || state.running) return;
    state.running = true; renderChecks();
    try { state.report = await fetchJson('/api/run-tests', { method: 'POST' }, 60000); toast('Tests finished'); }
    catch (e) { toast('Could not run the tests'); }
    state.running = false; renderChecks();
  });

  $$('.cmd').forEach((el) => el.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(el.dataset.copy); toast('Commands copied'); }
    catch (e) { toast('Select and copy the commands manually'); }
  }));

  function setTab(name) {
    $('#view-portal').hidden = name !== 'portal';
    $('#view-list').hidden = name !== 'list';
    $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    window.scrollTo({ top: name === 'list' ? 0 : window.scrollY, behavior: 'smooth' });
  }
  $$('[data-tab]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); setTab(el.dataset.tab); }));

  function themeIcon() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('#themeBtn').innerHTML = `<i data-icon="${dark ? 'sun' : 'moon'}"></i>`; paintIcons($('#themeBtn'));
  }
  $('#themeBtn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('handly-theme', next); } catch (e) { /* ignore */ }
    themeIcon();
  });

  /* ---------- boot ---------- */
  (async function init() {
    paintIcons(); themeIcon();
    try { await fetchJson('/api/health', null, 1500); state.mode = 'api'; } catch (e) { state.mode = 'static'; }
    await Promise.all([loadSubmissions(), loadReport()]);
    renderList(); renderChecks();
  })();
})();
