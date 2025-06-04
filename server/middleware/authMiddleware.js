// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure .env is in the same directory or path is configured

module.exports = function (req, res, next) {
  console.log(`\n--- SERVER authMiddleware ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Request received for: ${req.method} ${req.originalUrl}`);
  
  // Log all incoming headers to see exactly what the server gets
  // This is crucial for diagnosing if the header is stripped or casing changed by a proxy
  console.log(`All Incoming Headers: ${JSON.stringify(req.headers, null, 2)}`);
  
  let tokenToProcess;
  const authHeaderFromReqHeader = req.header('Authorization'); // Express's helper, usually case-insensitive
  const authHeaderFromReqHeaders = req.headers.authorization || req.headers.Authorization; // Direct access, check common casings

  if (authHeaderFromReqHeader) {
    console.log(`Authorization header (via req.header('Authorization')): ${authHeaderFromReqHeader}`);
    tokenToProcess = authHeaderFromReqHeader;
  } else if (authHeaderFromReqHeaders) {
    console.log(`Authorization header (via req.headers.authorization or req.headers.Authorization): ${authHeaderFromReqHeaders}`);
    tokenToProcess = authHeaderFromReqHeaders;
  } else {
    console.log("SERVER authMiddleware: No Authorization header found in req.header or req.headers. Denying access.");
    return res.status(401).json({ msg: 'No token, authorization denied (checked common header access methods)' });
  }

  const parts = tokenToProcess.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') { // Check 'bearer' case-insensitively
    console.log("SERVER authMiddleware: Authorization header is not in 'Bearer <token>' format. Value received:", tokenToProcess);
    return res.status(401).json({ msg: 'Token is not in Bearer format' });
  }
  
  const token = parts[1];
  // console.log("SERVER authMiddleware: Token extracted for verification:", token.substring(0, 15) + "...");

  try {
    if (!process.env.JWT_SECRET) {
      console.error("SERVER authMiddleware FATAL ERROR: JWT_SECRET is not defined on the server.");
      return res.status(500).json({ msg: 'Server configuration error: JWT secret missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.user.id;
    console.log(`SERVER authMiddleware: Token VERIFIED successfully. userId: ${req.userId}. Proceeding to next middleware/handler.`);
    next();
  } catch (err) {
    console.error("SERVER authMiddleware: Token verification FAILED:", err.name, "-", err.message);
    res.status(401).json({ msg: 'Token is not valid or expired', error: err.name });
  }
  console.log(`--- END SERVER authMiddleware ---`);
};
