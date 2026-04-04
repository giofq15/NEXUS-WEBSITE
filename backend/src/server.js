require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const colaboradoresRoutes = require('./routes/colaboradores.routes');
const moradoresRoutes = require('./routes/moradores.routes');
const ocorrenciasRoutes = require('./routes/ocorrencias.routes');
const reservasRoutes = require('./routes/reservas.routes');
const taxasRoutes = require('./routes/taxas.routes');
const areasLazerRoutes = require('./routes/areasLazer.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SSE — Notificações em tempo real (in-app)
const sseClients = new Map();

app.get('/api/notificacoes/sse', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).end();
  }

  let userId;
  try {
    const { verifyToken } = require('./utils/jwt');
    const decoded = verifyToken(token);
    userId = decoded.id;
  } catch {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `${userId}-${Date.now()}`;
  sseClients.set(clientId, { res, userId });

  res.write(`data: ${JSON.stringify({ tipo: 'conectado', mensagem: 'Conectado ao servidor de notificações' })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});

// Utilitário para enviar notificação SSE a um usuário específico
app.locals.notificarUsuario = function (userId, payload) {
  for (const [, client] of sseClients) {
    if (client.userId === userId) {
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }
};

// Utilitário para broadcast (todos conectados)
app.locals.broadcast = function (payload) {
  for (const [, client] of sseClients) {
    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
};

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/moradores', moradoresRoutes);
app.use('/api/ocorrencias', ocorrenciasRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/taxas', taxasRoutes);
app.use('/api/areas-lazer', areasLazerRoutes);

// Servir arquivos estáticos do frontend
app.use('/public', express.static(path.join(__dirname, '../../public')));
app.use('/views', express.static(path.join(__dirname, '../../views')));
app.use('/admin', express.static(path.join(__dirname, '../../views/admin')));
app.use('/colaborador', express.static(path.join(__dirname, '../../views/colaborador')));
app.use('/financeiro', express.static(path.join(__dirname, '../../views/financeiro')));
app.use('/ocorrencias', express.static(path.join(__dirname, '../../views/ocorrencias')));
app.use('/morador', express.static(path.join(__dirname, '../../views/morador')));
app.use(express.static(path.join(__dirname, '../../views/public')));

app.get('/public/login.html', (req, res) => {
  const queryIndex = req.originalUrl.indexOf('?');
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
  res.redirect(`/login.html${query}`);
});

app.get('/public/index.html', (req, res) => {
  res.redirect('/');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/public/index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor NEXUS rodando em ${publicBaseUrl}`);
});
