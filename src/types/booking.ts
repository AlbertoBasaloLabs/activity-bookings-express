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
 * Payment status type - placeholder for FR5 implementation
 */
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

/**
 * Activity information included in booking responses
 */
export interface BookingActivityInfo {
  name: string;
  slug: string;
  price: number;
  date: string;
  duration: number;
  location: string;
  status: string;
}

/**
 * Response DTO for booking retrieval - includes booking details with activity information and payment status
 */
export interface BookingResponse {
  id: string;
  activityId: string;
  userId: string;
  participants: number;
  createdAt: string;
  activity: BookingActivityInfo;
  paymentStatus: PaymentStatus;
}

/**
 * Validation error response format
 * Returned when validation fails (HTTP 400)
 */
export interface ValidationError {
  field: string;
  message: string;
}
