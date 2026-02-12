require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const moradoresRoutes = require('./routes/moradores.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/moradores', moradoresRoutes);

// Serve frontend static files
app.use('/public', express.static(path.join(__dirname, '../../public')));
app.use('/views', express.static(path.join(__dirname, '../../views')));

// Root → landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor NEXUS rodando em http://localhost:${PORT}`);
});
