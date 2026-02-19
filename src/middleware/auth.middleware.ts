import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../types/auth';
import { ErrorResponse } from '../types/error';
import { userRepository } from '../utils/data-loader';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { getSecurityMode, OPEN_SECURITY_MODE } from '../utils/security-mode';

const userService = new UserService(userRepository);

/**
 * Authentication middleware that validates JWT tokens
 * Extracts token from Authorization header and attaches user info to request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const securityMode = getSecurityMode();

  if (securityMode === OPEN_SECURITY_MODE) {
    try {
      const actingUser = userService.getFirstUserOrThrow();
      (req as AuthenticatedRequest).user = {
        id: actingUser.id,
        email: actingUser.email,
      };
      next();
      return;
    } catch (error) {
      logger.error('AuthMiddleware', 'Open security mode is enabled but acting user could not be resolved', error);
      const errorResponse: ErrorResponse = {
        message: 'Open security mode is enabled but no acting user is available.',
        errors: [],
      };
      res.status(500).json(errorResponse);
      return;
    }
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    logger.warn('AuthMiddleware', 'Missing authorization token');
    const errorResponse: ErrorResponse = {
      message: 'Authentication required. Please provide a valid token.',
      errors: [],
    };
    res.status(401).json(errorResponse);
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
    const errorResponse: ErrorResponse = {
      message: 'Invalid or expired token. Please login again.',
      errors: [],
    };
    res.status(401).json(errorResponse);
  }
}
