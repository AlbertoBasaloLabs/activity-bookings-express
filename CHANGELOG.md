# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
