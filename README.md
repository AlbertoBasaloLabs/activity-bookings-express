# ActivityBookings 

> Express with TypeScript version

A fictional activity booking system used during training sessions and demos.

A **backend API** for offering bookings to activities by registered users

- Activities are scheduled for specific dates with pricing and minimum and maximum participant thresholds.
- Activity status lifecycle: draft → published -> confirmed → done or cancelled.
- A user will be identified by their email address, having a username and password.
- One user can book multiple activities, but cannot exceed the available seats.
- Users will be billed upon booking, and payments will be processed through a mock gateway.

- Security is based on simple JWT tokens.
- Current client specs to use the types from the [types/](types/) folder.

[https://github.com/AlbertoBasaloLabs/ActivityBookingsExpress](https://github.com/AlbertoBasaloLabs/ActivityBookingsExpress)

**Quickstart**

```bash
# Set up the project
npm install
# Run the development server
npm run dev
# Build the project
npm run build
# Run the production server
npm run start
# Type-check only
npm run typecheck
```

The server listens on `http://localhost:3000` and responds with a small JSON payload. Configure the port via `PORT` env var.

**API Endpoints**

**System**
- `GET /health` - Health check endpoint

**Authentication**
- `POST /users` - Register a new user (requires: email, username, password, termsAccepted)
- `POST /login` - Login and receive JWT token (requires: email, password)

**Activities**
- `GET /activities` - List all activities (supports query parameters: `q`, `slug`, `_sort`, `_order`)
  - Query parameters:
    - `q`: Search term (searches in name, location, slug)
    - `slug`: Filter by exact slug match
    - `_sort`: Field to sort by (e.g., 'id', 'name', 'date', 'price')
    - `_order`: Sort order ('asc' or 'desc', defaults to 'asc')
- `GET /activities/:id` - Get a specific activity by ID
- `POST /activities` - Create a new activity (authenticated, requires: name, price, date, duration, location, minParticipants, maxParticipants, status)
- `PUT /activities/:id` - Update an existing activity (authenticated, owner only)
- `DELETE /activities/:id` - Delete an activity (authenticated, owner only)
- `PATCH /activities/:id/status` - Transition activity status (authenticated, owner only, requires: status)

**Bookings**
- `GET /bookings` - Get all bookings for authenticated user (supports query parameter: `activityId`)
  - Query parameters:
    - `activityId`: Filter bookings by activity ID
- `GET /bookings/:id` - Get a specific booking by ID (authenticated, owner only)
- `POST /bookings` - Create a new booking (authenticated, requires: activityId, participants)

See specifications in [specs/](specs/) folder for detailed API documentation.

--- 

- **Author**: [Alberto Basalo](https://albertobasalo.dev)
- **Ai Code Academy en Español**: [AI code Academy](https://aicode.academy)
- **Socials**:
  - [X](https://x.com/albertobasalo)
  - [LinkedIn](https://www.linkedin.com/in/albertobasalo/)
  - [GitHub](https://github.com/albertobasalo)
