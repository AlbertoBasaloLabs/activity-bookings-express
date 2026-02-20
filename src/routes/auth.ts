import { Request, Response, Router } from 'express';
import { UserService } from '../services/user.service';
import { AuthResponse } from '../types/auth';
import { ErrorResponse } from '../types/error';
import { LoginRequest } from '../types/user';
import { userRepository } from '../utils/data-loader';
import { mapAuthToApiDto } from '../utils/dto-mappers';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';

const router = Router();
const userService = new UserService(userRepository);

/**
 * POST /login
 * Authenticates a user and returns JWT token
 * Returns 200 on success, 400 on validation error, 401 on authentication failure
 */
router.post('/', (req: Request, res: Response) => {
  const errors = userService.validateLogin(req.body);
  if (errors.length > 0) {
    const errorResponse: ErrorResponse = {
      message: 'Validation failed',
      errors,
    };
    return res.status(400).json(errorResponse);
  }

  try {
    const user = userService.authenticate(req.body as LoginRequest);
    const response: AuthResponse = mapAuthToApiDto(user, generateToken(user.id, user.email));
    res.status(200).json(response);
  } catch (error) {
    logger.error('AuthRoute', 'Failed to authenticate user', error);
    const errorResponse: ErrorResponse = {
      message: error instanceof Error && error.message === 'Invalid email or password' 
        ? 'Invalid email or password' 
        : 'Authentication failed',
      errors: [],
    };
    res.status(401).json(errorResponse);
  }
});

export default router;
