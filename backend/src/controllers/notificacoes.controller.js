// SSE clients map: userId -> res
const clients = new Map();

function sse(req, res) {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Token nao fornecido' });

  const { verifyToken } = require('../utils/jwt');
  let user;
  try {
    user = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Token invalido' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write('data: {"tipo":"conectado"}\n\n');

  clients.set(user.id, res);

  req.on('close', () => {
    clients.delete(user.id);
  });
}

function notificarUsuario(userId, payload) {
  const client = clients.get(userId);
  if (client) {
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients.values()) {
    client.write(data);
  }
}

module.exports = { sse, notificarUsuario, broadcast };
