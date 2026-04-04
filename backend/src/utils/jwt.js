const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

module.exports = { generateToken, verifyToken, generateRefreshToken };
