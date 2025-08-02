const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

// Middleware que verifica la validez de un token JWT
module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // Obtener el token de la cabecera 'Authorization'

  if (!token) {
    return res.status(401).json({ error: 'No token, autorización denegada' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = { id: decoded.id }; // Añadir el ID del usuario al objeto de la petición
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

