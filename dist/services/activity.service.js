"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const logger_1 = require("../utils/logger");
class ActivityService {
    constructor() {
        this.activities = new Map();
        this.nextId = 1;
    }
    /**
     * Creates a new activity
     * Throws if validation fails
     */
    create(req, userId) {
        const errors = this.validateCreate(req);
        if (errors.length > 0) {
            throw new Error('Validation failed');
        }
        const activityId = `activity-${this.nextId++}`;
        const slug = this.generateSlug(req.name);
        const now = new Date().toISOString();
        const activity = {
            id: activityId,
            name: req.name,
            slug: slug,
            price: req.price,
            date: req.date,
            duration: req.duration,
            location: req.location,
            minParticipants: req.minParticipants,
            maxParticipants: req.maxParticipants,
            status: req.status,
            userId: userId,
            createdAt: now,
        };
        this.activities.set(activityId, activity);
        logger_1.logger.info('ActivityService', 'Activity created', { id: activityId, name: activity.name });
        return activity;
    }
    /**
     * Retrieves all activities
     * Returns array of all activities
     */
    getAll() {
        return Array.from(this.activities.values());
    }
    /**
     * Retrieves an activity by ID
     * Returns undefined if not found
     */
    getById(id) {
        return this.activities.get(id);
    }
    /**
     * Updates an existing activity
     * Throws if validation fails or activity not found
     * Only updates if userId matches
     */
    update(id, req, userId) {
        const activity = this.activities.get(id);
        if (!activity) {
            throw new Error('Activity not found');
        }
        if (activity.userId !== userId) {
            throw new Error('Forbidden: You can only update your own activities');
        }
        const errors = this.validateUpdate(req, activity);
        if (errors.length > 0) {
            throw new Error('Validation failed');
        }
        // Merge request data with existing activity
        const updatedActivity = {
            ...activity,
            ...req,
            // Regenerate slug if name changed
            slug: req.name ? this.generateSlug(req.name) : activity.slug,
            updatedAt: new Date().toISOString(),
        };
        this.activities.set(id, updatedActivity);
        logger_1.logger.info('ActivityService', 'Activity updated', { id, name: updatedActivity.name });
        return updatedActivity;
    }
    /**
     * Deletes an activity
     * Returns true if deleted, false if not found
     * Only deletes if userId matches
     */
    delete(id, userId) {
        const activity = this.activities.get(id);
        if (!activity) {
            return false;
        }
        if (activity.userId !== userId) {
            throw new Error('Forbidden: You can only delete your own activities');
        }
        this.activities.delete(id);
        logger_1.logger.info('ActivityService', 'Activity deleted', { id, name: activity.name });
        return true;
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
        // Validate name
        if (!req.name || typeof req.name !== 'string' || req.name.trim() === '') {
            errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
        }
        // Validate price
        if (typeof req.price !== 'number' || req.price <= 0) {
            errors.push({ field: 'price', message: 'Price is required and must be a positive number' });
        }
        // Validate date
        if (!req.date || typeof req.date !== 'string' || req.date.trim() === '') {
            errors.push({ field: 'date', message: 'Date is required and must be a valid ISO date string' });
        }
        else {
            const date = new Date(req.date);
            if (isNaN(date.getTime())) {
                errors.push({ field: 'date', message: 'Date must be a valid ISO date string' });
            }
            else {
                // Check if date is in the future
                if (date <= new Date()) {
                    errors.push({ field: 'date', message: 'Date must be in the future' });
                }
            }
        }
        // Validate duration
        if (typeof req.duration !== 'number' || req.duration <= 0) {
            errors.push({ field: 'duration', message: 'Duration is required and must be a positive number (in minutes)' });
        }
        // Validate location
        if (!req.location || typeof req.location !== 'string' || req.location.trim() === '') {
            errors.push({ field: 'location', message: 'Location is required and must be a non-empty string' });
        }
        // Validate minParticipants
        if (typeof req.minParticipants !== 'number' || req.minParticipants < 1) {
            errors.push({ field: 'minParticipants', message: 'Min participants is required and must be at least 1' });
        }
        // Validate maxParticipants
        if (typeof req.maxParticipants !== 'number' || req.maxParticipants < 1) {
            errors.push({ field: 'maxParticipants', message: 'Max participants is required and must be at least 1' });
        }
        // Validate minParticipants <= maxParticipants
        if (typeof req.minParticipants === 'number' &&
            typeof req.maxParticipants === 'number' &&
            req.minParticipants > req.maxParticipants) {
            errors.push({
                field: 'minParticipants',
                message: 'Min participants must be less than or equal to max participants',
            });
        }
        // Validate status
        const validStatuses = ['draft', 'published', 'confirmed', 'sold-out', 'done', 'cancelled'];
        if (!req.status || typeof req.status !== 'string' || !validStatuses.includes(req.status)) {
            errors.push({
                field: 'status',
                message: `Status is required and must be one of: ${validStatuses.join(', ')}`,
            });
        }
        return errors;
    }
    /**
     * Validates update request
     * Returns array of all validation errors (empty if valid)
     */
    validateUpdate(data, existingActivity) {
        const errors = [];
        if (!data || typeof data !== 'object') {
            return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
        }
        const req = data;
        // Validate name if provided
        if (req.name !== undefined) {
            if (typeof req.name !== 'string' || req.name.trim() === '') {
                errors.push({ field: 'name', message: 'Name must be a non-empty string' });
            }
        }
        // Validate price if provided
        if (req.price !== undefined) {
            if (typeof req.price !== 'number' || req.price <= 0) {
                errors.push({ field: 'price', message: 'Price must be a positive number' });
            }
        }
        // Validate date if provided
        if (req.date !== undefined) {
            if (typeof req.date !== 'string' || req.date.trim() === '') {
                errors.push({ field: 'date', message: 'Date must be a valid ISO date string' });
            }
            else {
                const date = new Date(req.date);
                if (isNaN(date.getTime())) {
                    errors.push({ field: 'date', message: 'Date must be a valid ISO date string' });
                }
                else {
                    // Check if date is in the future
                    if (date <= new Date()) {
                        errors.push({ field: 'date', message: 'Date must be in the future' });
                    }
                }
            }
        }
        // Validate duration if provided
        if (req.duration !== undefined) {
            if (typeof req.duration !== 'number' || req.duration <= 0) {
                errors.push({ field: 'duration', message: 'Duration must be a positive number (in minutes)' });
            }
        }
        // Validate location if provided
        if (req.location !== undefined) {
            if (typeof req.location !== 'string' || req.location.trim() === '') {
                errors.push({ field: 'location', message: 'Location must be a non-empty string' });
            }
        }
        // Validate minParticipants if provided
        if (req.minParticipants !== undefined) {
            if (typeof req.minParticipants !== 'number' || req.minParticipants < 1) {
                errors.push({ field: 'minParticipants', message: 'Min participants must be at least 1' });
            }
        }
        // Validate maxParticipants if provided
        if (req.maxParticipants !== undefined) {
            if (typeof req.maxParticipants !== 'number' || req.maxParticipants < 1) {
                errors.push({ field: 'maxParticipants', message: 'Max participants must be at least 1' });
            }
        }
        // Validate minParticipants <= maxParticipants
        const minParticipants = req.minParticipants !== undefined ? req.minParticipants : existingActivity.minParticipants;
        const maxParticipants = req.maxParticipants !== undefined ? req.maxParticipants : existingActivity.maxParticipants;
        if (typeof minParticipants === 'number' && typeof maxParticipants === 'number' && minParticipants > maxParticipants) {
            errors.push({
                field: 'minParticipants',
                message: 'Min participants must be less than or equal to max participants',
            });
        }
        // Validate status if provided
        if (req.status !== undefined) {
            const validStatuses = ['draft', 'published', 'confirmed', 'sold-out', 'done', 'cancelled'];
            if (typeof req.status !== 'string' || !validStatuses.includes(req.status)) {
                errors.push({
                    field: 'status',
                    message: `Status must be one of: ${validStatuses.join(', ')}`,
                });
            }
        }
        return errors;
    }
    /**
     * Generates a URL-friendly slug from a name
     * Converts to lowercase, replaces spaces with hyphens, removes special characters
     */
    generateSlug(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
}
exports.ActivityService = ActivityService;
