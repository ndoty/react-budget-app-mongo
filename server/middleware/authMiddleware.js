const jwt = require('jsonwebtoken');
const fs = require('fs');

// Function to read the JWT secret securely
function getJwtSecret() {
    const secretPath = '/run/secrets/jwt_secret';
    if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf-8').trim();
    }
    return process.env.JWT_SECRET;
}

const JWT_SECRET = getJwtSecret();

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

        if (!JWT_SECRET) {
            throw new Error('JWT Secret is not configured on the server.');
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Add user from payload to the request object
        req.user = decoded.user;

        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
