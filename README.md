# CSC418 Assignment Submission Portal

## Run the application
npm install
npm start
Open http://localhost:3000

## Run the tests
npm test

## Start the local report receiver
node receiver.js
Listens on port 4000 and saves the report as test-report.json.

## CI
GitHub Actions runs on a self-hosted runner on every push. After the tests,
make-report.js sends the JSON report to the local receiver
(http://localhost:4000/receive-report), for both passing and failing runs.