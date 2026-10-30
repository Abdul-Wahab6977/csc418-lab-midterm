# Handly - Assignment Submission Portal (CSC418 DevOps Lab Midterm)

Students enter name, registration number, assignment title and a submission URL.
Every push to GitHub runs automated tests, sends a JSON report to a receiver on your
computer, optionally emails it, and deploys the static frontend to GitHub Pages only if all tests pass.

## Run the app
```bash
npm install
npm start            # http://localhost:3000
```

## What every button does (when the backend is connected)
| Button | Action |
|---|---|
| Upload | validates and saves the submission through the backend |
| Delete (My submissions) | removes a saved submission |
| Run Tests | runs the real test suite on the backend and shows the fresh report |
| Push Defect | breaks the registration-number check, `git commit`, `git push` (local only) |
| Fix Defect and Push | restores the check, `git commit`, `git push` (local only) |
| Status pill | re-checks the backend connection |

The Push/Fix buttons run git on **your computer**, so use them with `npm start` inside your cloned repo.

## Host the backend online (optional, makes the GitHub Pages site fully working)
GitHub Pages cannot run Node. To connect the Pages site to a real backend:
1. Create a free account on https://render.com -> **New -> Blueprint** -> pick this repo (it reads `render.yaml`).
2. Copy the service URL, e.g. `https://handly.onrender.com`.
3. GitHub repo -> **Settings -> Secrets and variables -> Actions -> Variables -> New repository variable**: `API_URL` = that URL.
4. Push again. The Pages site now saves submissions and runs tests on that backend.

Without `API_URL` the Pages site still works in demo mode (submissions stored in the browser).

## Run the tests
```bash
npm run test:local   # runs the 8 tests, writes test-report.json, does not send it
npm test             # same, and POSTs the report to REPORT_URL (default http://localhost:4000/report)
```
A failing test makes the command (and the CI test stage) exit with code 1.

## Start the receiver (saves `test-report.json` on your computer)
```bash
npm run receiver     # listens on http://localhost:4000/report
```
GitHub-hosted runners cannot see your `localhost`, so expose the receiver with a tunnel
and keep both running during the demo:
```bash
ngrok http 4000                                   # or
cloudflared tunnel --url http://localhost:4000
```
Copy the public `https://....` URL and add `/report` at the end.

## GitHub setup
**Settings -> Secrets and variables -> Actions -> New repository secret**

| Secret | Value | Needed for |
|---|---|---|
| `REPORT_URL` | `https://<your-tunnel>/report` | local JSON report |
| `SMTP_USERNAME` | your Gmail address | email (bonus) |
| `SMTP_PASSWORD` | Gmail **App Password** (16 chars) | email (bonus) |
| `MAIL_TO` | address that receives the report | email (bonus) |

**Settings -> Pages -> Build and deployment -> Source: GitHub Actions** (bonus deploy).

## Demo workflow
```bash
git push                                   # 1. passing run
npm run defect && git commit -am "Introduce defect" && git push   # 2. failing run, deploy blocked
npm run fix    && git commit -am "Fix defect"       && git push   # 3. fixed, passing run, redeployed
```
After each run, `test-report.json` is updated by the receiver.

## Project layout
```
public/            frontend + shared validation (validation.js)
src/store.js       JSON-file storage
server.js          Express API + static hosting
test/              automated tests (node:test)
scripts/           run-tests.js, receiver.js, toggle-defect.js
.github/workflows/ci.yml
```
