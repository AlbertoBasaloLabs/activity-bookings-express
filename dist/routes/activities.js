"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_service_1 = require("../services/activity.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const activityService = new activity_service_1.ActivityService();
/**
 * POST /activities
 * Creates a new activity
 * Requires authentication
 * Returns 201 on success, 400 on validation error, 401 on authentication failure
 */
router.post('/', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    const errors = activityService.validateCreate(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    try {
        if (!authReq.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const activity = activityService.create(req.body, authReq.user.id);
        res.status(201).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to create activity', error);
        res.status(400).json({ error: 'Failed to create activity' });
    }
});
/**
 * GET /activities
 * Lists all activities
 * No authentication required
 * Returns 200 with array of activities
 */
router.get('/', (req, res) => {
    try {
        const activities = activityService.getAll();
        res.status(200).json(activities);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to get activities', error);
        res.status(500).json({ error: 'Failed to retrieve activities' });
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
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.status(200).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to get activity', error);
        res.status(500).json({ error: 'Failed to retrieve activity' });
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
        return res.status(404).json({ error: 'Activity not found' });
    }
    const errors = activityService.validateUpdate(req.body, existingActivity);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    try {
        if (!authReq.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const activity = activityService.update(req.params.id, req.body, authReq.user.id);
        res.status(200).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to update activity', error);
        if (error instanceof Error) {
            if (error.message === 'Activity not found') {
                return res.status(404).json({ error: 'Activity not found' });
            }
            if (error.message.includes('Forbidden')) {
                return res.status(403).json({ error: 'You can only update your own activities' });
            }
        }
        res.status(400).json({ error: 'Failed to update activity' });
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
            return res.status(401).json({ error: 'Authentication required' });
        }
        const deleted = activityService.delete(req.params.id, authReq.user.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to delete activity', error);
        if (error instanceof Error && error.message.includes('Forbidden')) {
            return res.status(403).json({ error: 'You can only delete your own activities' });
        }
        res.status(500).json({ error: 'Failed to delete activity' });
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
        return res.status(400).json({ error: 'Request body must be a valid JSON object' });
    }
    if (!req.body.status || typeof req.body.status !== 'string') {
        return res.status(400).json({ error: 'Status field is required and must be a string' });
    }
    const validStatuses = ['draft', 'published', 'confirmed', 'sold-out', 'done', 'cancelled'];
    if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({
            error: `Invalid status. Status must be one of: ${validStatuses.join(', ')}`,
        });
    }
    try {
        if (!authReq.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const activity = activityService.transitionStatus(req.params.id, req.body.status, authReq.user.id);
        res.status(200).json(activity);
    }
    catch (error) {
        logger_1.logger.error('ActivityRoute', 'Failed to transition activity status', error);
        if (error instanceof Error) {
            if (error.message === 'Activity not found') {
                return res.status(404).json({ error: 'Activity not found' });
            }
            if (error.message.includes('Forbidden')) {
                return res.status(403).json({ error: 'You can only transition your own activities' });
            }
            if (error.message.includes('Invalid status transition')) {
                return res.status(400).json({ error: error.message });
            }
        }
        res.status(500).json({ error: 'Failed to transition activity status' });
    }
});
exports.default = router;
