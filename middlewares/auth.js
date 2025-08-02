const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // "Bearer token"

  if (!token) {
    return res.status(401).json({ error: 'No token, autorización denegada' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = { id: decoded.id };  // <-- Muy importante que esto esté aquí
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
