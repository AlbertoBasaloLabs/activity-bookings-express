"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = require("../services/user.service");
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
const data_loader_1 = require("../utils/data-loader");
const router = (0, express_1.Router)();
const userService = new user_service_1.UserService(data_loader_1.userRepository);
/**
 * POST /login
 * Authenticates a user and returns JWT token
 * Returns 200 on success, 400 on validation error, 401 on authentication failure
 */
router.post('/', (req, res) => {
    const errors = userService.validateLogin(req.body);
    if (errors.length > 0) {
        const errorResponse = {
            message: 'Validation failed',
            errors,
        };
        return res.status(400).json(errorResponse);
    }
    try {
        const user = userService.authenticate(req.body);
        const response = {
            user: {
                id: parseInt(user.id.replace('user-', ''), 10) || 0,
                username: user.username,
                email: user.email,
                terms: user.terms,
            },
            accessToken: (0, jwt_1.generateToken)(user.id, user.email),
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('AuthRoute', 'Failed to authenticate user', error);
        const errorResponse = {
            message: error instanceof Error && error.message === 'Invalid email or password'
                ? 'Invalid email or password'
                : 'Authentication failed',
            errors: [],
        };
        res.status(401).json(errorResponse);
    }
});
exports.default = router;
