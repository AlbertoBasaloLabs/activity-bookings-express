"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const logger_1 = require("../utils/logger");
const json_repository_1 = require("../repositories/json.repository");
class PaymentService {
    constructor(gateway, repository) {
        this.nextId = 1;
        this.gateway = gateway;
        if (repository) {
            this.repository = repository;
            // Calculate nextId from repository
            const allPayments = this.repository.getAll();
            let maxId = 0;
            for (const payment of allPayments) {
                const match = payment.id.match(/-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxId) {
                        maxId = num;
                    }
                }
            }
            this.nextId = maxId + 1;
        }
        else {
            // Fallback to in-memory for backward compatibility
            this.repository = new json_repository_1.JsonRepository('db/payments.json');
            this.repository.load();
            const allPayments = this.repository.getAll();
            let maxId = 0;
            for (const payment of allPayments) {
                const match = payment.id.match(/-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxId) {
                        maxId = num;
                    }
                }
            }
            this.nextId = maxId + 1;
        }
    }
    /**
     * Charges via mock gateway and creates a payment on success.
     * Throws if gateway returns failure; no payment is created.
     */
    createForBooking(bookingId, amount, userId, activityId) {
        const result = this.gateway.charge(amount, {
            userId,
            bookingId,
            activityId,
        });
        if (!result.success) {
            throw new Error('Payment could not be processed');
        }
        const paymentId = `payment-${this.nextId++}`;
        const now = new Date().toISOString();
        const status = 'paid';
        const payment = {
            id: paymentId,
            bookingId,
            amount,
            status,
            createdAt: now,
        };
        this.repository.create(payment);
        logger_1.logger.info('PaymentService', 'Payment created', {
            id: paymentId,
            bookingId,
            amount,
            status,
        });
        return payment;
    }
    getById(id) {
        return this.repository.getById(id);
    }
}
exports.PaymentService = PaymentService;
