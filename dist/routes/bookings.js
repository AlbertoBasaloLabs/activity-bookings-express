"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_service_1 = require("../services/booking.service");
const activity_service_1 = require("../services/activity.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const activityService = new activity_service_1.ActivityService();
const bookingService = new booking_service_1.BookingService(activityService);
/**
 * POST /bookings
 * Creates a new booking
 * Requires authentication
 * Returns 201 on success, 400 on validation error or capacity exceeded, 401 on authentication failure, 404 if activity not found
 */
router.post('/', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    const errors = bookingService.validateCreate(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    try {
        if (!authReq.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const booking = bookingService.create(req.body, authReq.user.id);
        res.status(201).json(booking);
    }
    catch (error) {
        logger_1.logger.error('BookingRoute', 'Failed to create booking', error);
        if (error instanceof Error) {
            if (error.message === 'Activity not found') {
                return res.status(404).json({ error: 'Activity not found' });
            }
            if (error.message.includes('Capacity exceeded')) {
                return res.status(400).json({ error: error.message });
            }
        }
        res.status(400).json({ error: 'Failed to create booking' });
    }
});
exports.default = router;
