import { Request, Response, Router } from 'express';
import { BookingService } from '../services/booking.service';
import { ActivityService } from '../services/activity.service';
import { CreateBookingRequest } from '../types/booking';
import { AuthenticatedRequest } from '../types/auth';
import { authenticateToken } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityService = new ActivityService();
const bookingService = new BookingService(activityService);

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
    }
    res.status(400).json({ error: 'Failed to create booking' });
  }
});

export default router;
