const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware flessibile: accetta sia JWT (app principale)
 * che API Key (dashboard esterna).
 *
 * Header: Authorization: Bearer <jwt>
 *   oppure: x-api-key: <chiave>
 */
module.exports = function dashboardAuth(req, res, next) {
  // Prova prima l'API Key
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    if (apiKey !== process.env.DASHBOARD_API_KEY) {
      return res.status(401).json({ error: 'API Key non valida.' });
    }
    // L'API Key non ha user_id: usa un ID virtuale fisso
    // oppure passa user_id via query param: ?user_id=xxx
    req.user = { id: req.query.user_id || null, fromApiKey: true };
    return next();
  }

  // Fallback al JWT standard
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token o API Key mancanti.' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Token non valido o scaduto.' });
  }
};