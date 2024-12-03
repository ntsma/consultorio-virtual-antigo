let fs = require('fs');
require('dotenv').config();
let path = require('path');
let express = require('express');
let favicon = require('serve-favicon');

// Configurações HTTPS
var options = {
  key: fs.readFileSync(__dirname + '/certs/privkey.pem'),
  cert: fs.readFileSync(__dirname + '/certs/cert.pem'),
};

// Inicialização do Express
let app = express();
let server = require('https').createServer(options, app);
let serverhttp = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');

// Inicializar Socket.IO
io.of('/stream').on('connection', stream);

// Middleware para forçar HTTPS
function requireHTTPS(req, res, next) {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
}

// Middleware para servir arquivos estáticos (DEVE VIR ANTES DAS ROTas)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(favicon(path.join(__dirname, 'favicon.ico')));

// Força HTTPS
app.use(requireHTTPS);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para salas com validação do formato xxx-xxx-xxxx
app.get('/:room', (req, res) => {
  const roomPattern = /^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{4}$/;
  const room = req.params.room;
  
  if (!roomPattern.test(room)) {
    return res.redirect('/');
  }
  
  // Envia o arquivo index.html para todas as salas válidas
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Outras rotas
app.get('/full', (req, res) => {
  res.sendFile(path.join(__dirname, 'full.html'));
});

app.get('/error', (req, res) => {
  res.sendFile(path.join(__dirname, 'browserfail.html'));
});

// Socket.IO
io.of('/stream').on('connection', stream);

// Inicialização dos servidores
server.listen(process.env.PORT_HTTPS || 3001, '0.0.0.0', () => {
  console.log(`Server HTTPS running on port ${process.env.PORT_HTTPS || 3001}`);
});

serverhttp.listen(process.env.PORT_HTTP || 3000, '0.0.0.0', () => {
  console.log(`Server HTTP running on port ${process.env.PORT_HTTP || 3000}`);
});