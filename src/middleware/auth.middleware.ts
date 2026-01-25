import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types/auth';
import { logger } from '../utils/logger';

/**
 * Authentication middleware that validates JWT tokens
 * Extracts token from Authorization header and attaches user info to request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    logger.warn('AuthMiddleware', 'Missing authorization token');
    res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    logger.warn('AuthMiddleware', 'Invalid token', error);
    res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
}
