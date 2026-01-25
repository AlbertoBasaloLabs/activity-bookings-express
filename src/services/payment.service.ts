import { Payment, PaymentStatus } from '../types/payment';
import { MockPaymentGatewayAdapter } from '../types/payment';
import { logger } from '../utils/logger';

export class PaymentService {
  private payments = new Map<string, Payment>();
  private nextId = 1;
  private gateway: MockPaymentGatewayAdapter;

  constructor(gateway: MockPaymentGatewayAdapter) {
    this.gateway = gateway;
  }

  /**
   * Charges via mock gateway and creates a payment on success.
   * Throws if gateway returns failure; no payment is created.
   */
  createForBooking(
    bookingId: string,
    amount: number,
    userId: string,
    activityId: string
  ): Payment {
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
    const status: PaymentStatus = 'paid';

    const payment: Payment = {
      id: paymentId,
      bookingId,
      amount,
      status,
      createdAt: now,
    };

    this.payments.set(paymentId, payment);
    logger.info('PaymentService', 'Payment created', {
      id: paymentId,
      bookingId,
      amount,
      status,
    });
    return payment;
  }

  getById(id: string): Payment | undefined {
    return this.payments.get(id);
  }
}
