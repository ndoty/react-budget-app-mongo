const jwt = require('jsonwebtoken');

// Use the environment variable for the JWT_SECRET, but provide a
// default fallback to prevent the application from crashing.
const JWT_SECRET = process.env.JWT_SECRET || 'default_fallback_secret_for_development';

module.exports = function (req, res, next) {
    // Get token from the standard 'Authorization' header
    const authHeader = req.header('Authorization');

    // Check if the header exists
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // The header should be in the format "Bearer <token>"
        // We split the string and take the second part, which is the token itself.
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ msg: 'Token format is invalid' });
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Add user from payload to the request object so our API routes can use it
        req.user = decoded.user;
        
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
