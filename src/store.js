const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { validateSubmission } = require('../public/validation.js');

/** A tiny JSON-file store. Every read goes to disk, so data survives restarts. */
function createStore(filePath) {
  function read() {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
  }

  /** Newest first. */
  function list() {
    return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.seq - a.seq);
  }

  function add(input) {
    const result = validateSubmission(input);
    if (!result.ok) return { ok: false, errors: result.errors }; // nothing is written

    const all = read();
    const submission = {
      id: crypto.randomUUID(),
      seq: all.length + 1,
      ...result.value,
      createdAt: new Date().toISOString(),
    };
    all.push(submission);
    write(all);
    return { ok: true, submission };
  }

  function remove(id) {
    const all = read();
    const next = all.filter((s) => s.id !== id);
    if (next.length === all.length) return false;
    write(next);
    return true;
  }

  return { list, add, remove };
}

module.exports = { createStore };
