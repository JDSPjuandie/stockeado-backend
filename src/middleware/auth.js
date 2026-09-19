const jwt = require('jsonwebtoken');

/**
 * Verifica el JWT enviado en el header Authorization: Bearer <token>.
 * Si es válido, inyecta req.user = { id, comercioId, rol, email }.
 * Todo lo que cuelga de req.user.comercioId es lo que garantiza el
 * aislamiento entre comercios: cada query filtra siempre por esto.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Falta el token.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, comercioId, rol, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = { requireAuth };
