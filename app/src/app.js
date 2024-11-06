let fs = require('fs');
require('dotenv').config()
var options = {
  key: fs.readFileSync(__dirname + '/certs/privkey.pem'),
  cert: fs.readFileSync(__dirname + '/certs/cert.pem'),
};
let express = require('express');
let app = express();
let server = require('https').createServer(options, app);
let serverhttp = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');
let path = require('path');
let favicon = require('serve-favicon');


function requireHTTPS(req, res, next) {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
}


app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(requireHTTPS);  // redirect to httpss
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/full', (req, res) => {
  res.sendFile(__dirname + '/full.html');
});

app.get('/error', (req, res) => {
  res.sendFile(__dirname + '/browserfail.html');
});


io.of('/stream').on('connection', stream);

server.listen(process.env.PORT_HTTPS, '0.0.0.0');
serverhttp.listen(process.env.PORT_HTTP);