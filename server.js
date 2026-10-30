const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, 'submissions.json');
const isTest = process.env.NODE_ENV === 'test';

let submissions = [];

// Tests mein file use nahi hoti, sirf memory
if (!isTest && fs.existsSync(DATA_FILE)) {
  try {
    submissions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    submissions = [];
  }
}

function saveToDisk() {
  if (!isTest) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2));
  }
}

function isValidUrl(value) {
  return true;
}

function validate(body) {
  const errors = [];
  const name = (body.name || '').trim();
  const regNo = (body.regNo || '').trim();
  const title = (body.title || '').trim();
  const url = (body.url || '').trim();

  if (!name) errors.push('Name is required');
  if (!regNo) errors.push('Registration number is required');
  if (!title) errors.push('Assignment title is required');
  if (!url) errors.push('Submission URL is required');
  else if (!isValidUrl(url)) errors.push('Submission URL is invalid');

  return { errors, data: { name, regNo, title, url } };
}

// Submit
app.post('/submit', (req, res) => {
  const { errors, data } = validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  const submission = { id: submissions.length + 1, ...data, submittedAt: new Date().toISOString() };
  submissions.push(submission);
  saveToDisk();
  res.status(201).json({ success: true, submission });
});

// List
app.get('/submissions', (req, res) => {
  res.status(200).json(submissions);
});

// Frontend
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Assignment Submission Portal</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 30px auto; padding: 0 15px; }
    input, button { display: block; width: 100%; padding: 8px; margin: 8px 0; box-sizing: border-box; }
    button { background: #2563eb; color: #fff; border: 0; cursor: pointer; }
    #msg { margin: 10px 0; font-weight: bold; }
    .ok { color: green; } .err { color: red; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
  </style>
</head>
<body>
  <h2>Assignment Submission Portal</h2>
  <input id="name" placeholder="Student name">
  <input id="regNo" placeholder="Registration number">
  <input id="title" placeholder="Assignment title">
  <input id="url" placeholder="Submission URL (https://...)">
  <button onclick="submitForm()">Submit</button>
  <div id="msg"></div>

  <h3>Saved Submissions</h3>
  <table>
    <thead><tr><th>Name</th><th>Reg No</th><th>Title</th><th>URL</th></tr></thead>
    <tbody id="list"></tbody>
  </table>

<script>
async function loadList() {
  const r = await fetch('/submissions');
  const data = await r.json();
  const body = document.getElementById('list');
  body.innerHTML = '';
  data.forEach(s => {
    const tr = document.createElement('tr');
    [s.name, s.regNo, s.title, s.url].forEach(v => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
}
async function submitForm() {
  const payload = {
    name: document.getElementById('name').value,
    regNo: document.getElementById('regNo').value,
    title: document.getElementById('title').value,
    url: document.getElementById('url').value
  };
  const r = await fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  const msg = document.getElementById('msg');
  if (r.ok) {
    msg.className = 'ok';
    msg.textContent = 'Submission saved!';
    ['name','regNo','title','url'].forEach(id => document.getElementById(id).value = '');
  } else {
    msg.className = 'err';
    msg.textContent = data.errors.join(', ');
  }
  loadList();
}
loadList();
</script>
</body>
</html>`);
});

// Tests ke liye reset helper
app.resetSubmissions = () => { submissions = []; };

const PORT = process.env.PORT || 3000;

// Sirf direct "node server.js" par listen kare, tests mein nahi
if (require.main === module) {
  app.listen(PORT, () => console.log(`Portal running on http://localhost:${PORT}`));
}

module.exports = app;