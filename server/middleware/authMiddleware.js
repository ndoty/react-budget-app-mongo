// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure .env variables are loaded (especially JWT_SECRET)

module.exports = function (req, res, next) {
  console.log(`\n--- SERVER authMiddleware INVOCATION ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Requested Path: ${req.method} ${req.originalUrl}`);
  
  // Log ALL incoming headers from the request object
  // This is the most important log to check on the server side for this issue
  console.log(`ALL INCOMING HEADERS on server: ${JSON.stringify(req.headers, null, 2)}`);
  
  let tokenToProcess;
  // Express typically normalizes header names to lowercase when populating req.headers
  // req.header() is generally case-insensitive for lookup.
  const authHeaderFromHelper = req.header('Authorization'); 
  const authHeaderFromDirectAccessLower = req.headers.authorization; // Common actual casing
  const authHeaderFromDirectAccessUpper = req.headers.Authorization; // Just in case

  if (authHeaderFromHelper) {
    console.log(`SERVER authMiddleware: Found header via req.header('Authorization'): "${authHeaderFromHelper.substring(0, 20)}..."`);
    tokenToProcess = authHeaderFromHelper;
  } else if (authHeaderFromDirectAccessLower) {
    console.log(`SERVER authMiddleware: Found header via req.headers.authorization: "${authHeaderFromDirectAccessLower.substring(0, 20)}..."`);
    tokenToProcess = authHeaderFromDirectAccessLower;
  } else if (authHeaderFromDirectAccessUpper) {
    console.log(`SERVER authMiddleware: Found header via req.headers.Authorization: "${authHeaderFromDirectAccessUpper.substring(0, 20)}..."`);
    tokenToProcess = authHeaderFromDirectAccessUpper;
  } else {
    console.log("SERVER authMiddleware: NO Authorization header found using common access methods. Responding 401.");
    return res.status(401).json({ msg: 'No token, authorization denied (header not found)' });
  }

  const parts = tokenToProcess.split(' ');
  // Check 'bearer' prefix case-insensitively
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
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
    console.log(`SERVER authMiddleware: Token VERIFIED successfully. userId: ${req.userId}. Proceeding.`);
    next();
  } catch (err) {
    console.error("SERVER authMiddleware: Token verification FAILED. Error Name:", err.name, "| Message:", err.message);
    // Provide more specific error message if possible (e.g., token expired)
    let errMsg = 'Token is not valid';
    if (err.name === 'TokenExpiredError') {
      errMsg = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      errMsg = 'Token is malformed or invalid';
    }
    res.status(401).json({ msg: errMsg, error_details: err.name });
  }
  console.log(`--- END SERVER authMiddleware ---`);
};
