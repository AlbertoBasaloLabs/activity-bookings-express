import { Request, Response, Router } from 'express';
import { BookingService } from '../services/booking.service';
import { ActivityService } from '../services/activity.service';
import { PaymentService } from '../services/payment.service';
import { MockPaymentGateway } from '../services/mock-payment-gateway';
import { CreateBookingRequest } from '../types/booking';
import { AuthenticatedRequest } from '../types/auth';
import { authenticateToken } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityService = new ActivityService();
const paymentService = new PaymentService(new MockPaymentGateway());
const bookingService = new BookingService(activityService, paymentService);

/**
 * GET /bookings
 * Retrieves all bookings for the authenticated user
 * Requires authentication
 * Returns 200 with array of enriched booking objects, 401 if unauthenticated
 */
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookings = bookingService.getAllByUserId(authReq.user.id);
    const enrichedBookings = bookings.map((booking) => bookingService.enrichBookingWithActivity(booking));
    res.status(200).json(enrichedBookings);
  } catch (error) {
    logger.error('BookingRoute', 'Failed to retrieve bookings', error);
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

/**
 * GET /bookings/:id
 * Retrieves a specific booking by ID for the authenticated user
 * Requires authentication
 * Returns 200 with enriched booking object, 401 if unauthenticated, 404 if booking not found or does not belong to user
 */
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookingId = req.params.id;
    const booking = bookingService.getUserBookingById(bookingId, authReq.user.id);
    const enrichedBooking = bookingService.enrichBookingWithActivity(booking);
    res.status(200).json(enrichedBooking);
  } catch (error) {
    logger.error('BookingRoute', 'Failed to retrieve booking', error);
    if (error instanceof Error && error.message === 'Booking not found') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

/**
 * POST /bookings
 * Creates a new booking
 * Requires authentication
 * Returns 201 on success, 400 on validation error or capacity exceeded, 401 on authentication failure, 404 if activity not found
 */
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const errors = bookingService.validateCreate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const booking = bookingService.create(req.body as CreateBookingRequest, authReq.user.id);
    res.status(201).json(booking);
  } catch (error) {
    logger.error('BookingRoute', 'Failed to create booking', error);
    if (error instanceof Error) {
      if (error.message === 'Activity not found') {
        return res.status(404).json({ error: 'Activity not found' });
      }
      if (error.message.includes('Capacity exceeded')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Payment could not be processed') {
        return res.status(402).json({ error: 'Payment could not be processed' });
      }
    }
    res.status(400).json({ error: 'Failed to create booking' });
  }
});

export default router;
