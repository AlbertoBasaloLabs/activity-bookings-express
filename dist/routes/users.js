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
 * POST /users
 * Registers a new user
 * Returns 201 on success, 400 on validation error
 */
router.post('/', (req, res) => {
    const errors = userService.validateRegister(req.body);
    if (errors.length > 0) {
        const errorResponse = {
            message: 'Validation failed',
            errors,
        };
        return res.status(400).json(errorResponse);
    }
    try {
        const user = userService.create(req.body);
        const response = {
            user: {
                id: parseInt(user.id.replace('user-', ''), 10) || 0,
                username: user.username,
                email: user.email,
                terms: user.terms,
            },
            accessToken: (0, jwt_1.generateToken)(user.id, user.email),
        };
        res.status(201).json(response);
    }
    catch (error) {
        logger_1.logger.error('UserRoute', 'Failed to register user', error);
        const errorResponse = {
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
exports.default = router;
