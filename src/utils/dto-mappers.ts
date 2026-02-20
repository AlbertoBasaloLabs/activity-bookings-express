import { Activity } from '../types/activity';
import {
    ApiActivityDto,
    ApiBookingDto,
    ApiPaymentStatus,
    ApiUserAccessTokenDto,
    ApiUserDto,
} from '../types/api-dto';
import { Booking } from '../types/booking';
import { Payment } from '../types/payment';
import { User } from '../types/user';

type ResourceName = 'user' | 'activity' | 'booking' | 'payment';

function internalIdToNumber(id: string): number {
  const numericValue = Number(id);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  const match = id.match(/-(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
}

export function toInternalResourceId(id: string | number, resource: ResourceName): string {
  if (typeof id === 'number' && Number.isFinite(id)) {
    return `${resource}-${Math.trunc(id)}`;
  }

  const value = String(id).trim();
  if (value === '') {
    return value;
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return `${resource}-${Math.trunc(numericValue)}`;
  }

  if (value.startsWith(`${resource}-`)) {
    return value;
  }

  return value;
}

export function mapUserToApiDto(user: User): ApiUserDto {
  return {
    id: internalIdToNumber(user.id),
    username: user.username,
    email: user.email,
    terms: user.terms,
  };
}

export function mapAuthToApiDto(user: User, accessToken: string): ApiUserAccessTokenDto {
  return {
    user: mapUserToApiDto(user),
    accessToken,
  };
}

export function mapActivityToApiDto(activity: Activity): ApiActivityDto {
  return {
    id: internalIdToNumber(activity.id),
    name: activity.name,
    slug: activity.slug,
    price: activity.price,
    date: activity.date,
    duration: activity.duration,
    location: activity.location,
    minParticipants: activity.minParticipants,
    maxParticipants: activity.maxParticipants,
    status: activity.status,
    userId: internalIdToNumber(activity.userId),
  };
}

function mapPaymentStatus(status: Booking['paymentStatus']): ApiPaymentStatus {
  if (!status) {
    return 'none';
  }

  return status;
}

export function mapBookingToApiDto(
  booking: Booking,
  activity: Activity | undefined,
  payment: Payment | undefined
): ApiBookingDto {
  return {
    id: internalIdToNumber(booking.id),
    activityId: internalIdToNumber(booking.activityId),
    userId: internalIdToNumber(booking.userId),
    date: activity?.date ?? booking.createdAt,
    participants: booking.participants,
    payment: {
      method: 'none',
      amount: payment?.amount ?? 0,
      status: mapPaymentStatus(booking.paymentStatus),
    },
  };
}