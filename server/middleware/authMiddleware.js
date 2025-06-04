const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Token is not in Bearer format' });
  }
  const token = parts[1];

  try {
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined on the server for middleware.");
      return res.status(500).json({ msg: 'Server configuration error: JWT secret missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.user.id;
    next();
  } catch (err) {
    console.error("Token verification failed in middleware:", err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
