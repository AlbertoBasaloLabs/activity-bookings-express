import { Request, Response, Router } from 'express';
import { UserService } from '../services/user.service';
import { AuthResponse } from '../types/auth';
import { ErrorResponse } from '../types/error';
import { CreateUserRequest } from '../types/user';
import { userRepository } from '../utils/data-loader';
import { mapAuthToApiDto } from '../utils/dto-mappers';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';

const router = Router();
const userService = new UserService(userRepository);

/**
 * POST /users
 * Registers a new user
 * Returns 201 on success, 400 on validation error
 */
router.post('/', (req: Request, res: Response) => {
  const errors = userService.validateRegister(req.body);
  if (errors.length > 0) {
    const errorResponse: ErrorResponse = {
      message: 'Validation failed',
      errors,
    };
    return res.status(400).json(errorResponse);
  }

  try {
    const user = userService.create(req.body as CreateUserRequest);
    const response: AuthResponse = mapAuthToApiDto(user, generateToken(user.id, user.email));
    res.status(201).json(response);
  } catch (error) {
    logger.error('UserRoute', 'Failed to register user', error);
    const errorResponse: ErrorResponse = {
      message: error instanceof Error && error.message === 'Email already registered'
        ? 'Email is already registered'
        : 'Failed to register user',
      errors: error instanceof Error && error.message === 'Email already registered'
        ? [{ field: 'email', message: 'Email is already registered' }]
        : [],
    };
    res.status(400).json(errorResponse);
  }
});

export default router;
