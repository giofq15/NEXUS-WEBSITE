const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao fornecido' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}

function isAdminLevel(user) {
  return user.accessLevel === 'ADMIN' || user.accessLevel === 'ROOT' || user.role === 'ADMIN';
}

function isRootLevel(user) {
  return user.accessLevel === 'ROOT';
}

function isMoradorLevel(user) {
  return user.role === 'MORADOR' || user.accessLevel === 'MORADOR';
}

function authorizeAdmin(req, res, next) {
  if (!isAdminLevel(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

function authorizeRoot(req, res, next) {
  if (!isRootLevel(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito ao usuario root' });
  }
  next();
}

function authorizeMorador(req, res, next) {
  if (!isMoradorLevel(req.user) && !isAdminLevel(req.user)) {
    return res.status(403).json({ error: 'Acesso restrito a moradores' });
  }
  next();
}

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeRoot,
  authorizeMorador,
  isAdminLevel,
  isRootLevel,
  isMoradorLevel,
};
