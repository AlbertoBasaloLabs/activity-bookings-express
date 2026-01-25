/**
 * Domain entity - represents a booking as stored in the system
 */
export interface Booking {
  id: string;
  activityId: string;
  userId: string;
  participants: number;
  createdAt: string;
}

/**
 * Request DTO for creating a new booking
 */
export interface CreateBookingRequest {
  activityId: string;
  participants: number;
}

/**
 * Validation error response format
 * Returned when validation fails (HTTP 400)
 */
export interface ValidationError {
  field: string;
  message: string;
}
