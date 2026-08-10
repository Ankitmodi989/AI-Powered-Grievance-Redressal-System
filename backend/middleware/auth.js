const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'No token provided. Please login.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId, role, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Session expired. Please login again.' });
  }
}

module.exports = authMiddleware;