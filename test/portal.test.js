const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('../src/store');

const valid = {
  studentName: 'Abdul Wahab',
  regNo: 'CIIT/FA23-BSE-001/ATK',
  title: 'DevOps Lab Midterm',
  url: 'https://github.com/Abdul-Wahab6977/csc418-lab-midterm',
};

function freshFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'handly-'));
  return path.join(dir, 'submissions.json');
}

test('Complete details and valid URL are saved and displayed', () => {
  const store = createStore(freshFile());
  const result = store.add(valid);
  assert.equal(result.ok, true);
  const list = store.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].url, valid.url);
  assert.equal(list[0].studentName, valid.studentName);
});

test('Missing registration number is rejected with a message', () => {
  const store = createStore(freshFile());
  const result = store.add({ ...valid, regNo: '' });
  assert.equal(result.ok, false);
  assert.match(result.errors.regNo, /registration number is required/i);
  assert.equal(store.list().length, 0);
});

test('Invalid submission URL is rejected and not saved', () => {
  const store = createStore(freshFile());
  const result = store.add({ ...valid, url: 'not a url' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.url);
  assert.equal(store.list().length, 0);
});

test('All required fields reject blank and whitespace values', () => {
  const store = createStore(freshFile());
  for (const field of ['studentName', 'regNo', 'title', 'url']) {
    for (const blank of ['', '   ', '\t\n']) {
      const result = store.add({ ...valid, [field]: blank });
      assert.equal(result.ok, false, `${field} should reject ${JSON.stringify(blank)}`);
      assert.ok(result.errors[field]);
    }
  }
  assert.equal(store.list().length, 0);
});

test('Unsafe URL protocols are rejected', () => {
  const store = createStore(freshFile());
  for (const url of ['javascript:alert(1)', 'data:text/html,<h1>x</h1>', 'file:///etc/passwd', 'ftp://example.com/a']) {
    assert.equal(store.add({ ...valid, url }).ok, false, `${url} should be rejected`);
  }
  assert.equal(store.list().length, 0);
});

test('Multiple submissions survive a fresh read in latest-first order', () => {
  const file = freshFile();
  const store = createStore(file);
  store.add({ ...valid, title: 'First' });
  store.add({ ...valid, title: 'Second' });
  store.add({ ...valid, title: 'Third' });
  const reopened = createStore(file); // simulates a server restart
  assert.deepEqual(reopened.list().map((s) => s.title), ['Third', 'Second', 'First']);
});

test('Invalid attempt does not change an existing saved record', () => {
  const store = createStore(freshFile());
  store.add(valid);
  const before = JSON.stringify(store.list());
  store.add({ ...valid, url: 'nope' });
  store.add({ ...valid, regNo: '' });
  assert.equal(JSON.stringify(store.list()), before);
});

test('Valid input is trimmed before saving', () => {
  const store = createStore(freshFile());
  store.add({
    studentName: '  Abdul Wahab  ',
    regNo: '  CIIT/FA23-BSE-001/ATK ',
    title: ' DevOps Lab Midterm ',
    url: '  https://example.com/work  ',
  });
  const [saved] = store.list();
  assert.equal(saved.studentName, 'Abdul Wahab');
  assert.equal(saved.regNo, 'CIIT/FA23-BSE-001/ATK');
  assert.equal(saved.title, 'DevOps Lab Midterm');
  assert.equal(saved.url, 'https://example.com/work');
});
