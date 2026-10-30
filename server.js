const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/report') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      fs.writeFileSync('test-report.json', body);
      console.log('Report saved:', new Date().toISOString());
      res.writeHead(200);
      res.end('ok');
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(4000, () => console.log('Receiver on http://localhost:4000'));