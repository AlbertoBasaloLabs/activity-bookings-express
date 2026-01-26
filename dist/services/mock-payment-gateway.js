"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPaymentGateway = void 0;
const logger_1 = require("../utils/logger");
/**
 * Mock payment gateway that simulates success and failure.
 * Deterministic failure: when amount is divisible by 1000, charge fails.
 * Use this to test HTTP 402 and "payment could not be processed" flows.
 */
class MockPaymentGateway {
    charge(amount, _context) {
        const fail = amount > 0 && amount % 1000 === 0;
        if (fail) {
            logger_1.logger.info('MockPaymentGateway', 'Simulated payment failure', { amount });
            return { success: false };
        }
        logger_1.logger.info('MockPaymentGateway', 'Simulated payment success', { amount });
        return { success: true };
    }
}
exports.MockPaymentGateway = MockPaymentGateway;
