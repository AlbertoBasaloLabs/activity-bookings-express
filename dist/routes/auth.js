"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = require("../services/user.service");
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const userService = new user_service_1.UserService();
/**
 * POST /auth/register
 * Registers a new user
 * Returns 201 on success, 400 on validation error
 */
router.post('/register', (req, res) => {
    const errors = userService.validateRegister(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
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
        logger_1.logger.error('AuthRoute', 'Failed to register user', error);
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
router.post('/login', (req, res) => {
    const errors = userService.validateLogin(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
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
        if (error instanceof Error && error.message === 'Invalid email or password') {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.status(401).json({ error: 'Authentication failed' });
    }
});
exports.default = router;
