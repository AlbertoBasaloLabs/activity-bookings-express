import { Request, Response, Router } from 'express';
import { UserService } from '../services/user.service';
import { generateToken } from '../utils/jwt';
import { AuthResponse } from '../types/auth';
import { CreateUserRequest, LoginRequest } from '../types/user';
import { logger } from '../utils/logger';

const router = Router();
const userService = new UserService();

/**
 * POST /auth/register
 * Registers a new user
 * Returns 201 on success, 400 on validation error
 */
router.post('/register', (req: Request, res: Response) => {
  const errors = userService.validateRegister(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const user = userService.create(req.body as CreateUserRequest);
    const response: AuthResponse = {
      user: {
        id: parseInt(user.id.replace('user-', ''), 10) || 0,
        username: user.username,
        email: user.email,
        terms: user.terms,
      },
      accessToken: generateToken(user.id, user.email),
    };
    res.status(201).json(response);
  } catch (error) {
    logger.error('AuthRoute', 'Failed to register user', error);
    if (error instanceof Error && error.message === 'Email already registered') {
      return res.status(400).json({
        errors: [{ field: 'email', message: 'Email is already registered' }],
      });
    }
    res.status(400).json({ error: 'Failed to register user' });
  }
});

/**
 * POST /auth/login
 * Authenticates a user and returns JWT token
 * Returns 200 on success, 400 on validation error, 401 on authentication failure
 */
router.post('/login', (req: Request, res: Response) => {
  const errors = userService.validateLogin(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const user = userService.authenticate(req.body as LoginRequest);
    const response: AuthResponse = {
      user: {
        id: parseInt(user.id.replace('user-', ''), 10) || 0,
        username: user.username,
        email: user.email,
        terms: user.terms,
      },
      accessToken: generateToken(user.id, user.email),
    };
    res.status(200).json(response);
  } catch (error) {
    logger.error('AuthRoute', 'Failed to authenticate user', error);
    if (error instanceof Error && error.message === 'Invalid email or password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
});

export default router;
