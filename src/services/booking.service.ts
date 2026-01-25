import {
  Booking,
  BookingResponse,
  CreateBookingRequest,
  PaymentStatus,
  ValidationError,
} from '../types/booking';
import { ActivityService } from './activity.service';
import { logger } from '../utils/logger';

export class BookingService {
  private bookings = new Map<string, Booking>();
  private nextId = 1;
  private activityService: ActivityService;

  constructor(activityService: ActivityService) {
    this.activityService = activityService;
  }

  /**
   * Creates a new booking
   * Throws if validation fails, activity not found, or capacity exceeded
   */
  create(req: CreateBookingRequest, userId: string): Booking {
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

    const booking: Booking = {
      id: bookingId,
      activityId: req.activityId,
      userId: userId,
      participants: req.participants,
      createdAt: now,
    };

    this.bookings.set(bookingId, booking);
    logger.info('BookingService', 'Booking created', {
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
  getBookingsByActivityId(activityId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((booking) => booking.activityId === activityId);
  }

  /**
   * Calculates available capacity for an activity
   * Returns available capacity as activity.maxParticipants minus sum of participants from existing bookings
   */
  calculateAvailableCapacity(activityId: string): number {
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
   * Retrieves all bookings for a specific user
   * Returns array of bookings filtered by userId
   */
  getAllByUserId(userId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((booking) => booking.userId === userId);
  }

  /**
   * Retrieves a booking by ID
   * Returns undefined if not found
   */
  getById(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  /**
   * Retrieves a booking by ID and validates it belongs to the user
   * Throws if booking not found or does not belong to user
   */
  getUserBookingById(id: string, userId: string): Booking {
    const booking = this.getById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.userId !== userId) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  /**
   * Enriches booking with activity information
   * Returns booking response with activity details
   */
  enrichBookingWithActivity(booking: Booking): BookingResponse {
    const activity = this.activityService.getById(booking.activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    return {
      id: booking.id,
      activityId: booking.activityId,
      userId: booking.userId,
      participants: booking.participants,
      createdAt: booking.createdAt,
      activity: {
        name: activity.name,
        slug: activity.slug,
        price: activity.price,
        date: activity.date,
        duration: activity.duration,
        location: activity.location,
        status: activity.status,
      },
      paymentStatus: this.enrichBookingWithPaymentStatus(booking),
    };
  }

  /**
   * Enriches booking with payment status (placeholder for FR5)
   * Returns default 'pending' status until payment service is implemented
   */
  enrichBookingWithPaymentStatus(booking: Booking): PaymentStatus {
    // Placeholder: return default 'pending' status
    // TODO: Integrate with payment service when FR5 is implemented
    return 'pending';
  }

  /**
   * Validates create request
   * Returns array of all validation errors (empty if valid)
   */
  validateCreate(data: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
      return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
    }

    const req = data as Record<string, unknown>;

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
