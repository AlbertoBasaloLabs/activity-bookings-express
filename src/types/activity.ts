/**
 * Activity status type - matches client type definition
 */
export type ActivityStatus =
  | 'published'
  | 'confirmed'
  | 'sold-out'
  | 'done'
  | 'cancelled'
  | 'draft';

/**
 * Domain entity - represents an activity as stored in the system
 */
export interface Activity {
  id: string;
  name: string;
  slug: string;
  price: number;
  date: string; // ISO date string
  duration: number; // in minutes
  location: string;
  minParticipants: number;
  maxParticipants: number;
  status: ActivityStatus;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Request DTO for creating a new activity
 */
export interface CreateActivityRequest {
  name: string;
  price: number;
  date: string; // ISO date string
  duration: number; // in minutes
  location: string;
  minParticipants: number;
  maxParticipants: number;
  status: ActivityStatus;
}

/**
 * Request DTO for updating an activity
 */
export interface UpdateActivityRequest {
  name?: string;
  price?: number;
  date?: string; // ISO date string
  duration?: number; // in minutes
  location?: string;
  minParticipants?: number;
  maxParticipants?: number;
  status?: ActivityStatus;
}

/**
 * Validation error response format
 * Returned when validation fails (HTTP 400)
 */
export interface ValidationError {
  field: string;
  message: string;
}
