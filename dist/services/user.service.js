"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const logger_1 = require("../utils/logger");
class UserService {
    constructor() {
        this.users = new Map();
        this.emailIndex = new Map(); // email -> userId
        this.nextId = 1;
    }
    /**
     * Creates a new user
     * Throws if validation fails or email already exists
     */
    create(req) {
        const errors = this.validateRegister(req);
        if (errors.length > 0) {
            throw new Error('Validation failed');
        }
        // Check if email already exists
        if (this.emailIndex.has(req.email.toLowerCase())) {
            throw new Error('Email already registered');
        }
        const userId = `user-${this.nextId++}`;
        const user = {
            id: userId,
            username: req.username,
            email: req.email.toLowerCase(),
            password: req.password, // In production, hash this with bcrypt
            terms: req.terms,
            createdAt: new Date().toISOString(),
        };
        this.users.set(userId, user);
        this.emailIndex.set(user.email, userId);
        logger_1.logger.info('UserService', 'User created', { id: userId, email: user.email });
        return user;
    }
    /**
     * Retrieves a user by ID
     * Returns undefined if not found
     */
    getById(id) {
        return this.users.get(id);
    }
    /**
     * Retrieves a user by email
     * Returns undefined if not found
     */
    getByEmail(email) {
        const userId = this.emailIndex.get(email.toLowerCase());
        if (!userId) {
            return undefined;
        }
        return this.users.get(userId);
    }
    /**
     * Authenticates a user with email and password
     * Returns user if credentials are valid, throws if invalid
     */
    authenticate(req) {
        const errors = this.validateLogin(req);
        if (errors.length > 0) {
            throw new Error('Validation failed');
        }
        const user = this.getByEmail(req.email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // In production, compare hashed password with bcrypt
        if (user.password !== req.password) {
            throw new Error('Invalid email or password');
        }
        logger_1.logger.info('UserService', 'User authenticated', { id: user.id, email: user.email });
        return user;
    }
    /**
     * Validates registration request
     * Returns array of all validation errors (empty if valid)
     */
    validateRegister(data) {
        const errors = [];
        if (!data || typeof data !== 'object') {
            return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
        }
        const req = data;
        // Validate username
        if (!req.username || typeof req.username !== 'string' || req.username.trim() === '') {
            errors.push({ field: 'username', message: 'Username is required and must be a non-empty string' });
        }
        // Validate email
        if (!req.email || typeof req.email !== 'string' || req.email.trim() === '') {
            errors.push({ field: 'email', message: 'Email is required and must be a non-empty string' });
        }
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(req.email)) {
                errors.push({ field: 'email', message: 'Email must be a valid email address' });
            }
        }
        // Validate password
        if (!req.password || typeof req.password !== 'string' || req.password.length < 6) {
            errors.push({ field: 'password', message: 'Password is required and must be at least 6 characters long' });
        }
        // Validate terms
        if (req.terms !== true) {
            errors.push({ field: 'terms', message: 'Terms acceptance is required' });
        }
        return errors;
    }
    /**
     * Validates login request
     * Returns array of all validation errors (empty if valid)
     */
    validateLogin(data) {
        const errors = [];
        if (!data || typeof data !== 'object') {
            return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
        }
        const req = data;
        // Validate email
        if (!req.email || typeof req.email !== 'string' || req.email.trim() === '') {
            errors.push({ field: 'email', message: 'Email is required and must be a non-empty string' });
        }
        // Validate password
        if (!req.password || typeof req.password !== 'string' || req.password.trim() === '') {
            errors.push({ field: 'password', message: 'Password is required and must be a non-empty string' });
        }
        return errors;
    }
}
exports.UserService = UserService;
