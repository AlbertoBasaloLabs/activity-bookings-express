"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRepository = exports.bookingRepository = exports.userRepository = exports.activityRepository = void 0;
exports.loadAllData = loadAllData;
const json_repository_1 = require("../repositories/json.repository");
const logger_1 = require("./logger");
/**
 * Repository instances - shared across the application
 */
exports.activityRepository = new json_repository_1.JsonRepository('db/activities.json', 'db/seed/activities.json');
exports.userRepository = new json_repository_1.JsonRepository('db/users.json');
exports.bookingRepository = new json_repository_1.JsonRepository('db/bookings.json');
exports.paymentRepository = new json_repository_1.JsonRepository('db/payments.json');
/**
 * Loads all seed data and persisted data on application startup
 */
function loadAllData() {
    logger_1.logger.info('DataLoader', 'Loading data from repositories...');
    try {
        exports.activityRepository.load();
        logger_1.logger.info('DataLoader', 'Activities loaded');
    }
    catch (error) {
        logger_1.logger.error('DataLoader', 'Failed to load activities', error);
    }
    try {
        exports.userRepository.load();
        logger_1.logger.info('DataLoader', 'Users loaded');
    }
    catch (error) {
        logger_1.logger.error('DataLoader', 'Failed to load users', error);
    }
    try {
        exports.bookingRepository.load();
        logger_1.logger.info('DataLoader', 'Bookings loaded');
    }
    catch (error) {
        logger_1.logger.error('DataLoader', 'Failed to load bookings', error);
    }
    try {
        exports.paymentRepository.load();
        logger_1.logger.info('DataLoader', 'Payments loaded');
    }
    catch (error) {
        logger_1.logger.error('DataLoader', 'Failed to load payments', error);
    }
    logger_1.logger.info('DataLoader', 'Data loading completed');
}
