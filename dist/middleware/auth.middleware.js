"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
/**
 * Authentication middleware that validates JWT tokens
 * Extracts token from Authorization header and attaches user info to request
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        logger_1.logger.warn('AuthMiddleware', 'Missing authorization token');
        res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = {
            id: payload.userId,
            email: payload.email,
        };
        next();
    }
    catch (error) {
        logger_1.logger.warn('AuthMiddleware', 'Invalid token', error);
        res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
    }
}
