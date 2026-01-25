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

**Node + TypeScript Setup**
- **Files:** See [package.json](package.json), [tsconfig.json](tsconfig.json), and [src/index.ts](src/index.ts).
- **Dev server:** Starts with `tsx` and serves JSON on `/`.
- **Scripts:** `dev`, `build`, `start`, `typecheck` defined in [package.json](package.json).

**Quickstart**
- **Install:**

```bash
npm install
```

- **Run dev:**

```bash
npm run dev
```

- **Build:**

```bash
npm run build
```

- **Start (built app):**

```bash
npm run start
```

- **Type-check only:**

```bash
npm run typecheck
```

The server listens on `http://localhost:3000` and responds with a small JSON payload. Configure the port via `PORT` env var.

**API Endpoints**

**System**
- `GET /health` - Health check endpoint

**Rockets**
- `GET /rockets` - Retrieve all rockets
- `GET /rockets/:id` - Retrieve a specific rocket by ID
- `POST /rockets` - Create a new rocket (requires: name, range, capacity)
- `PUT /rockets/:id` - Update an existing rocket
- `DELETE /rockets/:id` - Delete a rocket

**Launches**
- `GET /launches` - Retrieve all launches
- `GET /launches/:id` - Retrieve a specific launch by ID
- `POST /launches` - Create a new launch (requires: rocketId, launchDateTime, price, minPassengers)
- `PUT /launches/:id` - Update an existing launch
- `DELETE /launches/:id` - Delete a launch

**Customers**
- `GET /customers` - Retrieve all customers
- `GET /customers/:email` - Retrieve a specific customer by email (URL-encoded)
- `POST /customers` - Create a new customer (requires: email, name, phone)
- `PUT /customers/:email` - Update an existing customer
- `DELETE /customers/:email` - Delete a customer

See specifications in [specs/](specs/) folder for detailed API documentation.
