# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-01-25

### Added
- Payment processing (FR5): automatic billing on booking creation via mock gateway
- Payment types (`Payment`, `PaymentStatus`, `MockPaymentGatewayAdapter`, `ChargeContext`, `ChargeResult`)
- Mock payment gateway (`MockPaymentGateway`) with deterministic failure (amount divisible by 1000)
- `PaymentService` with `createForBooking`, in-memory payment storage
- `paymentId` and `paymentStatus` on `Booking` and booking responses
- HTTP 402 Payment Required when mock gateway rejects charge (no booking created)

### Changed
- `POST /bookings` charges user before creating booking; 201 response includes `paymentId` and `paymentStatus`
- `BookingService.create` integrates `PaymentService`; payment failure returns 402

## [1.5.0] - 2026-01-25

### Added
- Booking retrieval endpoints (`GET /bookings`, `GET /bookings/:id`)
- BookingResponse type with enriched booking data including activity information
- PaymentStatus type (pending, paid, refunded) as placeholder for FR5
- `getAllByUserId` method to retrieve all bookings for a user
- `getById` and `getUserBookingById` methods for booking retrieval
- `enrichBookingWithActivity` method to add activity details to booking responses
- `enrichBookingWithPaymentStatus` method (placeholder for payment integration)
- User authorization validation for booking retrieval (users can only access their own bookings)
- Security: unauthorized booking access returns 404 (not 403) to prevent information disclosure

## [1.4.0] - 2026-01-25

### Added
- Booking creation endpoint (`POST /bookings`)
- Booking service with capacity validation
- Booking type definitions (Booking, CreateBookingRequest)
- Capacity calculation logic to prevent overbooking
- Validation for booking requests (activityId, participants)
- Error handling for capacity exceeded scenarios
- Activity existence validation before booking creation

### Changed
- Updated application to include bookings router

## [1.3.0] - 2026-01-25

### Added
- Activity status lifecycle management endpoint (`PATCH /activities/:id/status`)
- Status transition validation logic with controlled lifecycle rules
- `getValidTransitions` method to retrieve allowed next statuses
- `isValidStatusTransition` method to validate status transitions
- `transitionStatus` method for controlled status updates
- Status transition validation: draft → published → confirmed → done/cancelled
- Support for sold-out status transitions (published ↔ sold-out ↔ confirmed)
- Terminal state enforcement (done and cancelled cannot transition to other statuses)

### Changed
- Updated activity update validation to prevent direct status changes via PUT endpoint
- Status changes must now go through dedicated PATCH /activities/:id/status endpoint

## [1.2.0] - 2026-01-25

### Added
- Activity management endpoints (`POST /activities`, `GET /activities`, `GET /activities/:id`, `PUT /activities/:id`, `DELETE /activities/:id`)
- Activity service with full CRUD operations
- Activity type definitions with ActivityStatus
- Activity creation with automatic slug generation
- Activity ownership validation for update and delete operations
- Input validation for activity creation and updates
- Date validation (must be in the future)
- Participant threshold validation (minParticipants <= maxParticipants)
- Price and duration validation (must be positive numbers)

## [1.1.0] - 2026-01-25

### Added
- User registration endpoint (`POST /auth/register`)
- User login endpoint (`POST /auth/login`)
- JWT token generation and validation
- Authentication middleware for protecting routes
- User service with in-memory storage
- Input validation for registration and login requests
- Email uniqueness validation during registration
- Password validation (minimum 6 characters)
- Terms acceptance validation

## [1.0.0] - 2026-01-25

### Added
- Minimal Express.js API setup with TypeScript
- Project configuration files (`package.json`, `tsconfig.json`)
- Express application entry point (`src/index.ts`)
- Health check endpoint at `/health`
- Root endpoint at `/` returning API status
- Logger utility for application logging
- Development server using `tsx` for direct TypeScript execution
- Production build configuration using TypeScript compiler
- Environment variable support for port configuration (defaults to 3000)
