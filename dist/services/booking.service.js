"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const logger_1 = require("../utils/logger");
class BookingService {
    constructor(activityService) {
        this.bookings = new Map();
        this.nextId = 1;
        this.activityService = activityService;
    }
    /**
     * Creates a new booking
     * Throws if validation fails, activity not found, or capacity exceeded
     */
    create(req, userId) {
        const errors = this.validateCreate(req);
        if (errors.length > 0) {
            throw new Error('Validation failed');
        }
        // Check if activity exists
        const activity = this.activityService.getById(req.activityId);
        if (!activity) {
            throw new Error('Activity not found');
        }
        // Check capacity
        const availableCapacity = this.calculateAvailableCapacity(req.activityId);
        if (req.participants > availableCapacity) {
            throw new Error(`Capacity exceeded. Available: ${availableCapacity}, Requested: ${req.participants}`);
        }
        const bookingId = `booking-${this.nextId++}`;
        const now = new Date().toISOString();
        const booking = {
            id: bookingId,
            activityId: req.activityId,
            userId: userId,
            participants: req.participants,
            createdAt: now,
        };
        this.bookings.set(bookingId, booking);
        logger_1.logger.info('BookingService', 'Booking created', {
            id: bookingId,
            activityId: req.activityId,
            participants: req.participants,
        });
        return booking;
    }
    /**
     * Retrieves all bookings for a specific activity
     * Returns array of bookings filtered by activityId
     */
    getBookingsByActivityId(activityId) {
        return Array.from(this.bookings.values()).filter((booking) => booking.activityId === activityId);
    }
    /**
     * Calculates available capacity for an activity
     * Returns available capacity as activity.maxParticipants minus sum of participants from existing bookings
     */
    calculateAvailableCapacity(activityId) {
        const activity = this.activityService.getById(activityId);
        if (!activity) {
            return 0;
        }
        const existingBookings = this.getBookingsByActivityId(activityId);
        const totalBookedParticipants = existingBookings.reduce((sum, booking) => sum + booking.participants, 0);
        const availableCapacity = activity.maxParticipants - totalBookedParticipants;
        return Math.max(0, availableCapacity);
    }
    /**
     * Validates create request
     * Returns array of all validation errors (empty if valid)
     */
    validateCreate(data) {
        const errors = [];
        if (!data || typeof data !== 'object') {
            return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
        }
        const req = data;
        // Validate activityId
        if (!req.activityId || typeof req.activityId !== 'string' || req.activityId.trim() === '') {
            errors.push({ field: 'activityId', message: 'Activity ID is required and must be a non-empty string' });
        }
        // Validate participants
        if (typeof req.participants !== 'number' || req.participants < 1) {
            errors.push({
                field: 'participants',
                message: 'Participants is required and must be a positive number (at least 1)',
            });
        }
        return errors;
    }
}
exports.BookingService = BookingService;
