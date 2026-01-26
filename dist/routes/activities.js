"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_service_1 = require("../services/activity.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const data_loader_1 = require("../utils/data-loader");
const router = (0, express_1.Router)();
const activityService = new activity_service_1.ActivityService(data_loader_1.activityRepository);
/**
 * Normalizes create request body:
 * - Parses numeric strings to numbers (price, duration, minParticipants, maxParticipants)
 * - Applies default values (duration: 60, status: 'draft')
 */
function normalizeCreateRequest(body) {
    if (!body || typeof body !== 'object') {
        return {};
    }
    const req = body;
    const normalized = { ...req };
    // Parse numeric fields from strings
    if (req.price !== undefined) {
        const price = typeof req.price === 'string' ? Number(req.price) : req.price;
        normalized.price = price;
    }
    if (req.duration !== undefined) {
        const duration = typeof req.duration === 'string' ? Number(req.duration) : req.duration;
        normalized.duration = duration;
    }
    if (req.minParticipants !== undefined) {
        const minParticipants = typeof req.minParticipants === 'string' ? Number(req.minParticipants) : req.minParticipants;
        normalized.minParticipants = minParticipants;
    }
    if (req.maxParticipants !== undefined) {
        const maxParticipants = typeof req.maxParticipants === 'string' ? Number(req.maxParticipants) : req.maxParticipants;
        normalized.maxParticipants = maxParticipants;
    }
    // Apply defaults
    if (normalized.duration === undefined || normalized.duration === null) {
        normalized.duration = 60;
    }
    if (normalized.status === undefined || normalized.status === null) {
        normalized.status = 'draft';
    }
    return normalized;
}
/**
 * POST /activities
 * Creates a new activity
 * Requires authentication
 * Returns 201 on success, 400 on validation error, 401 on authentication failure
 */
router.post('/', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    // Normalize request body: parse numeric strings and apply defaults
    const normalizedBody = normalizeCreateRequest(req.body);
    const errors = activityService.validateCreate(normalizedBody);
    if (errors.length > 0) {
        const errorResponse = {
            message: 'Validation failed',
            errors,
        };
        return res.status(400).json(errorResponse);
    }
    try {
        if (!authReq.user) {
            const errorResponse = {
                message: 'Authentication required',
                errors: [],
            };
            return res.status(401).json(errorResponse);
        }
        const activity = activityService.create(normalizedBody, authReq.user.id);
        res.status(201).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to create activity', error);
        const errorResponse = {
            message: 'Failed to create activity',
            errors: [],
        };
        res.status(400).json(errorResponse);
    }
});
/**
 * GET /activities
 * Lists all activities with optional query parameters
 * Query parameters:
 *   - q: Search term (searches in name, location, slug)
 *   - slug: Filter by exact slug match
 *   - _sort: Field to sort by (e.g., 'id', 'name', 'date')
 *   - _order: Sort order ('asc' or 'desc', defaults to 'asc')
 * No authentication required
 * Returns 200 with array of activities
 */
router.get('/', (req, res) => {
    try {
        const queryParams = req.query;
        const hasQueryParams = queryParams.q || queryParams.slug || queryParams._sort;
        let activities;
        if (hasQueryParams) {
            activities = activityService.query({
                q: queryParams.q,
                slug: queryParams.slug,
                _sort: queryParams._sort,
                _order: queryParams._order || 'asc',
            });
        }
        else {
            activities = activityService.getAll();
        }
        res.status(200).json(activities);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to get activities', error);
        const errorResponse = {
            message: 'Failed to retrieve activities',
            errors: [],
        };
        res.status(500).json(errorResponse);
    }
});
/**
 * GET /activities/:id
 * Gets a specific activity by ID
 * No authentication required
 * Returns 200 on success, 404 if not found
 */
router.get('/:id', (req, res) => {
    try {
        const activity = activityService.getById(req.params.id);
        if (!activity) {
            const errorResponse = {
                message: 'Activity not found',
                errors: [],
            };
            return res.status(404).json(errorResponse);
        }
        res.status(200).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to get activity', error);
        const errorResponse = {
            message: 'Failed to retrieve activity',
            errors: [],
        };
        res.status(500).json(errorResponse);
    }
});
/**
 * PUT /activities/:id
 * Updates an existing activity
 * Requires authentication and ownership
 * Returns 200 on success, 400 on validation error, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.put('/:id', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    const existingActivity = activityService.getById(req.params.id);
    if (!existingActivity) {
        const errorResponse = {
            message: 'Activity not found',
            errors: [],
        };
        return res.status(404).json(errorResponse);
    }
    const errors = activityService.validateUpdate(req.body, existingActivity);
    if (errors.length > 0) {
        const errorResponse = {
            message: 'Validation failed',
            errors,
        };
        return res.status(400).json(errorResponse);
    }
    try {
        if (!authReq.user) {
            const errorResponse = {
                message: 'Authentication required',
                errors: [],
            };
            return res.status(401).json(errorResponse);
        }
        const activity = activityService.update(req.params.id, req.body, authReq.user.id);
        res.status(200).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to update activity', error);
        let message = 'Failed to update activity';
        let statusCode = 400;
        if (error instanceof Error) {
            if (error.message === 'Activity not found') {
                message = 'Activity not found';
                statusCode = 404;
            }
            else if (error.message.includes('Forbidden')) {
                message = 'You can only update your own activities';
                statusCode = 403;
            }
        }
        const errorResponse = {
            message,
            errors: [],
        };
        res.status(statusCode).json(errorResponse);
    }
});
/**
 * DELETE /activities/:id
 * Deletes an activity
 * Requires authentication and ownership
 * Returns 204 on success, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.delete('/:id', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    try {
        if (!authReq.user) {
            const errorResponse = {
                message: 'Authentication required',
                errors: [],
            };
            return res.status(401).json(errorResponse);
        }
        const deleted = activityService.delete(req.params.id, authReq.user.id);
        if (!deleted) {
            const errorResponse = {
                message: 'Activity not found',
                errors: [],
            };
            return res.status(404).json(errorResponse);
        }
        res.status(204).send();
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to delete activity', error);
        let message = 'Failed to delete activity';
        let statusCode = 500;
        if (error instanceof Error && error.message.includes('Forbidden')) {
            message = 'You can only delete your own activities';
            statusCode = 403;
        }
        const errorResponse = {
            message,
            errors: [],
        };
        res.status(statusCode).json(errorResponse);
    }
});
/**
 * PATCH /activities/:id/status
 * Transitions an activity to a new status
 * Requires authentication and ownership
 * Returns 200 on success, 400 on invalid transition, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.patch('/:id/status', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
        const errorResponse = {
            message: 'Request body must be a valid JSON object',
            errors: [],
        };
        return res.status(400).json(errorResponse);
    }
    if (!req.body.status || typeof req.body.status !== 'string') {
        const errorResponse = {
            message: 'Status field is required and must be a string',
            errors: [],
        };
        return res.status(400).json(errorResponse);
    }
    const validStatuses = ['draft', 'published', 'confirmed', 'sold-out', 'done', 'cancelled'];
    if (!validStatuses.includes(req.body.status)) {
        const errorResponse = {
            message: `Invalid status. Status must be one of: ${validStatuses.join(', ')}`,
            errors: [],
        };
        return res.status(400).json(errorResponse);
    }
    try {
        if (!authReq.user) {
            const errorResponse = {
                message: 'Authentication required',
                errors: [],
            };
            return res.status(401).json(errorResponse);
        }
        const activity = activityService.transitionStatus(req.params.id, req.body.status, authReq.user.id);
        res.status(200).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to transition activity status', error);
        let message = 'Failed to transition activity status';
        let statusCode = 500;
        if (error instanceof Error) {
            if (error.message === 'Activity not found') {
                message = 'Activity not found';
                statusCode = 404;
            }
            else if (error.message.includes('Forbidden')) {
                message = 'You can only transition your own activities';
                statusCode = 403;
            }
            else if (error.message.includes('Invalid status transition')) {
                message = error.message;
                statusCode = 400;
            }
        }
        const errorResponse = {
            message,
            errors: [],
        };
        res.status(statusCode).json(errorResponse);
    }
});
exports.default = router;
