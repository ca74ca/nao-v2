const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello World');
});
server.listen(3001, () => console.log('Server running on 3001'));
