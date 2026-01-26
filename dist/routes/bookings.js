"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_service_1 = require("../services/booking.service");
const activity_service_1 = require("../services/activity.service");
const payment_service_1 = require("../services/payment.service");
const mock_payment_gateway_1 = require("../services/mock-payment-gateway");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const data_loader_1 = require("../utils/data-loader");
const router = (0, express_1.Router)();
const activityService = new activity_service_1.ActivityService(data_loader_1.activityRepository);
const paymentService = new payment_service_1.PaymentService(new mock_payment_gateway_1.MockPaymentGateway(), data_loader_1.paymentRepository);
const bookingService = new booking_service_1.BookingService(activityService, paymentService, data_loader_1.bookingRepository);
/**
 * GET /bookings
 * Retrieves all bookings for the authenticated user
 * Optional query parameter: activityId - filters bookings by activity ID
 * Requires authentication
 * Returns 200 with array of enriched booking objects, 401 if unauthenticated
 */
router.get('/', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    try {
        if (!authReq.user) {
            const errorResponse = {
                message: 'Authentication required',
                errors: [],
            };
            return res.status(401).json(errorResponse);
        }
        let bookings = bookingService.getAllByUserId(authReq.user.id);
        // Filter by activityId if provided as query parameter
        const activityId = req.query.activityId;
        if (activityId) {
            bookings = bookings.filter((booking) => booking.activityId === activityId);
        }
        const enrichedBookings = bookings.map((booking) => bookingService.enrichBookingWithActivity(booking));
        res.status(200).json(enrichedBookings);
    }
    catch (error) {
        logger_1.logger.error('BookingRoute', 'Failed to retrieve bookings', error);
        const errorResponse = {
            message: 'Failed to retrieve bookings',
            errors: [],
        };
        res.status(500).json(errorResponse);
    }
});
/**
 * GET /bookings/:id
 * Retrieves a specific booking by ID for the authenticated user
 * Requires authentication
 * Returns 200 with enriched booking object, 401 if unauthenticated, 404 if booking not found or does not belong to user
 */
router.get('/:id', auth_middleware_1.authenticateToken, (req, res) => {
    const authReq = req;
    try {
        if (!authReq.user) {
            const errorResponse = {
                message: 'Authentication required',
                errors: [],
            };
            return res.status(401).json(errorResponse);
        }
        const bookingId = req.params.id;
        const booking = bookingService.getUserBookingById(bookingId, authReq.user.id);
        const enrichedBooking = bookingService.enrichBookingWithActivity(booking);
        res.status(200).json(enrichedBooking);
    }
    catch (error) {
        logger_1.logger.error('BookingRoute', 'Failed to retrieve booking', error);
        const errorResponse = {
            message: error instanceof Error && error.message === 'Booking not found'
                ? 'Booking not found'
                : 'Failed to retrieve booking',
            errors: [],
        };
        const statusCode = error instanceof Error && error.message === 'Booking not found' ? 404 : 500;
        res.status(statusCode).json(errorResponse);
    }
});
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
        const booking = bookingService.create(req.body, authReq.user.id);
        res.status(201).json(booking);
    }
    catch (error) {
        logger_1.logger.error('BookingRoute', 'Failed to create booking', error);
        let message = 'Failed to create booking';
        let statusCode = 400;
        if (error instanceof Error) {
            if (error.message === 'Activity not found') {
                message = 'Activity not found';
                statusCode = 404;
            }
            else if (error.message.includes('Capacity exceeded')) {
                message = error.message;
                statusCode = 400;
            }
            else if (error.message === 'Payment could not be processed') {
                message = 'Payment could not be processed';
                statusCode = 402;
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
