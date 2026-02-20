export type ApiPaymentMethod = 'none' | 'cash' | 'creditCard' | 'paypal';

export type ApiPaymentStatus = 'none' | 'pending' | 'paid' | 'refunded';

export interface ApiUserDto {
  id: number;
  username: string;
  email: string;
  terms: boolean;
}

export interface ApiUserAccessTokenDto {
  user: ApiUserDto;
  accessToken: string;
}

export interface ApiActivityDto {
  id: number;
  name: string;
  slug: string;
  price: number;
  date: string;
  duration: number;
  location: string;
  minParticipants: number;
  maxParticipants: number;
  status: 'published' | 'confirmed' | 'sold-out' | 'done' | 'cancelled' | 'draft';
  userId: number;
}

export interface ApiBookingPaymentDto {
  method: ApiPaymentMethod;
  amount: number;
  status: ApiPaymentStatus;
}

export interface ApiBookingDto {
  id: number;
  activityId: number;
  userId: number;
  date: string;
  participants: number;
  payment?: ApiBookingPaymentDto;
}