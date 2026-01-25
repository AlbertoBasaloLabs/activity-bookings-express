# Minimal Express API with TypeScript Specification

- **Reference**: [PRD](/PRD.md) TR1, TR3.
- **Issue**: {_to be created_[#ID](URL to the issue)}
- **Status**: Draft

## Problem Description

The project needs a minimal Express.js API setup with TypeScript to serve as the foundation for the ActivityBookings backend. The setup should be minimal with no testing, linting, or additional dependencies beyond the core requirements for a modern Express API with TypeScript.

### User Stories

- As a **developer**, I want to **have a minimal Express API with TypeScript** so that **I can start building the ActivityBookings backend without unnecessary tooling**.
- As a **developer**, I want to **run the API in development mode** so that **I can iterate quickly during development**.
- As a **developer**, I want to **build and run the API in production mode** so that **I can deploy the application**.

## Solution Overview

### User/App interface

- RESTful API endpoints served via Express.js
- Health check endpoint at `/health`
- Root endpoint at `/` returning API status
- JSON request/response format

### Model and logic

- Express application with JSON middleware
- TypeScript strict mode configuration
- Development server using `tsx` for direct TypeScript execution
- Production build using TypeScript compiler
- Environment variable support for port configuration

### Persistence

- No persistence layer required for this minimal setup
- In-memory storage will be added in subsequent features

## Acceptance Criteria

- [ ] THE [System] SHALL have a `package.json` with Express and TypeScript dependencies
- [ ] THE [System] SHALL have a `tsconfig.json` with strict TypeScript configuration
- [ ] THE [System] SHALL have a `src/index.ts` file that sets up an Express application
- [ ] WHEN [a request is made to `/health`] THE [System] SHALL return a JSON response with status "ok"
- [ ] WHEN [a request is made to `/`] THE [System] SHALL return a JSON response with API information
- [ ] THE [System] SHALL support JSON request body parsing via Express middleware
- [ ] THE [System] SHALL start a development server using `npm run dev` command
- [ ] THE [System] SHALL build TypeScript to JavaScript using `npm run build` command
- [ ] THE [System] SHALL start a production server using `npm run start` command
- [ ] THE [System] SHALL use the PORT environment variable or default to 3000
- [ ] THE [System] SHALL NOT include test dependencies or configuration
- [ ] THE [System] SHALL NOT include linting dependencies or configuration

## Implementation Plan

- **Specification**: [feat-minimal-express-api.spec.md](specs/feat-minimal-express-api.spec.md)
- **PRD**: [TR1 RESTful API Architecture](PRD.md#tr1-restful-api-architecture), [TR3 TypeScript Implementation](PRD.md#tr3-typescript-implementation)
- **Branch**: feat/minimal-express-api

### Step 1: Project Configuration Setup

**Description**: Create the foundational configuration files for the TypeScript Express project.

**Tasks**:
- [ ] Create `package.json` with Express, TypeScript, `tsx`, and `@types/express` dependencies
- [ ] Create `tsconfig.json` with strict TypeScript configuration targeting ES2020
- [ ] Add npm scripts: `dev` (using tsx), `build` (using tsc), `start` (running built app), `typecheck` (type checking only)

### Step 2: Express Application Setup

**Description**: Create the main Express application entry point with basic middleware and routes.

**Tasks**:
- [ ] Create `src/index.ts` file
- [ ] Set up Express app with JSON middleware
- [ ] Implement root endpoint `/` returning API status JSON
- [ ] Implement health check endpoint `/health` returning status "ok"
- [ ] Configure server to listen on PORT environment variable or default to 3000
- [ ] Add basic logging for server startup

### Step 3: Build Configuration

**Description**: Configure TypeScript build output and ensure production build works correctly.

**Tasks**:
- [ ] Configure `tsconfig.json` output directory to `dist/`
- [ ] Ensure `package.json` start script points to compiled JavaScript in `dist/`
- [ ] Verify build process creates proper directory structure
