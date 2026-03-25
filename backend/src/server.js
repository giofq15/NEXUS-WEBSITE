require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const colaboradoresRoutes = require('./routes/colaboradores.routes');
const ocorrenciasRoutes = require('./routes/ocorrencias.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/moradores', colaboradoresRoutes);
app.use('/api/ocorrencias', ocorrenciasRoutes);

// Serve frontend static files
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
// Root → landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/public/index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor NEXUS rodando em ${publicBaseUrl}`);
});
