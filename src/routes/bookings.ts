import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { ActivityService } from '../services/activity.service';
import { BookingService } from '../services/booking.service';
import { MockPaymentGateway } from '../services/mock-payment-gateway';
import { PaymentService } from '../services/payment.service';
import { AuthenticatedRequest } from '../types/auth';
import { CreateBookingRequest } from '../types/booking';
import { ErrorResponse } from '../types/error';
import { activityRepository, bookingRepository, paymentRepository } from '../utils/data-loader';
import { mapBookingToApiDto, toInternalResourceId } from '../utils/dto-mappers';
import { logger } from '../utils/logger';

const router = Router();
const activityService = new ActivityService(activityRepository);
const paymentService = new PaymentService(new MockPaymentGateway(), paymentRepository);
const bookingService = new BookingService(activityService, paymentService, bookingRepository);

/**
 * GET /bookings
 * Retrieves all bookings for the authenticated user
 * Optional query parameter: activityId - filters bookings by activity ID
 * Requires authentication
 * Returns 200 with array of enriched booking objects, 401 if unauthenticated
 */
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    if (!authReq.user) {
      const errorResponse: ErrorResponse = {
        message: 'Authentication required',
        errors: [],
      };
      return res.status(401).json(errorResponse);
    }

    let bookings = bookingService.getAllByUserId(authReq.user.id);

    // Filter by activityId if provided as query parameter
    const activityId = req.query.activityId as string | undefined;
    if (activityId) {
      const internalActivityId = toInternalResourceId(activityId, 'activity');
      bookings = bookings.filter((booking) => booking.activityId === internalActivityId);
    }

    const response = bookings.map((booking) => {
      const activity = activityService.getById(booking.activityId);
      const payment = booking.paymentId ? paymentService.getById(booking.paymentId) : undefined;
      return mapBookingToApiDto(booking, activity, payment);
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('BookingRoute', 'Failed to retrieve bookings', error);
    const errorResponse: ErrorResponse = {
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
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    if (!authReq.user) {
      const errorResponse: ErrorResponse = {
        message: 'Authentication required',
        errors: [],
      };
      return res.status(401).json(errorResponse);
    }

    const bookingId = toInternalResourceId(req.params.id, 'booking');
    const booking = bookingService.getUserBookingById(bookingId, authReq.user.id);
    const activity = activityService.getById(booking.activityId);
    const payment = booking.paymentId ? paymentService.getById(booking.paymentId) : undefined;
    res.status(200).json(mapBookingToApiDto(booking, activity, payment));
  } catch (error) {
    logger.error('BookingRoute', 'Failed to retrieve booking', error);
    const errorResponse: ErrorResponse = {
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
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const rawBody = req.body as Record<string, unknown>;
  const normalizedBody: Record<string, unknown> = {
    ...rawBody,
    activityId:
      rawBody && rawBody.activityId !== undefined
        ? toInternalResourceId(rawBody.activityId as string | number, 'activity')
        : rawBody?.activityId,
  };

  const errors = bookingService.validateCreate(normalizedBody);
  if (errors.length > 0) {
    const errorResponse: ErrorResponse = {
      message: 'Validation failed',
      errors,
    };
    return res.status(400).json(errorResponse);
  }

  try {
    if (!authReq.user) {
      const errorResponse: ErrorResponse = {
        message: 'Authentication required',
        errors: [],
      };
      return res.status(401).json(errorResponse);
    }

    const booking = bookingService.create(normalizedBody as unknown as CreateBookingRequest, authReq.user.id);
    const activity = activityService.getById(booking.activityId);
    const payment = booking.paymentId ? paymentService.getById(booking.paymentId) : undefined;
    res.status(201).json(mapBookingToApiDto(booking, activity, payment));
  } catch (error) {
    logger.error('BookingRoute', 'Failed to create booking', error);
    let message = 'Failed to create booking';
    let statusCode = 400;
    
    if (error instanceof Error) {
      if (error.message === 'Activity not found') {
        message = 'Activity not found';
        statusCode = 404;
      } else if (error.message.includes('Capacity exceeded')) {
        message = error.message;
        statusCode = 400;
      } else if (error.message === 'Payment could not be processed') {
        message = 'Payment could not be processed';
        statusCode = 402;
      }
    }
    
    const errorResponse: ErrorResponse = {
      message,
      errors: [],
    };
    res.status(statusCode).json(errorResponse);
  }
});

export default router;
