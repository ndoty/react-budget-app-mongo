// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const tokenToProcess = req.header('Authorization');

  if (!tokenToProcess) {
    return res.status(401).json({ msg: 'No token, authorization denied (header not found)' });
  }

  const parts = tokenToProcess.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ msg: 'Token is not in Bearer format' });
  }
  
  const token = parts[1];

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: 'Server configuration error: JWT secret missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.user.id;
    next();
  } catch (err) {
    let errMsg = 'Token is not valid';
    if (err.name === 'TokenExpiredError') {
      errMsg = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      errMsg = 'Token is malformed or invalid';
    }
    res.status(401).json({ msg: errMsg, error_details: err.name });
  }
};
