# JaniTrack - Full Project Context

> Feed this file to any AI model for complete context about this project.

## What Is This?

**JaniTrack** is a workforce monitoring platform for corporate cleaning service providers. Two roles: **Manager** (admin) and **Staff** (cleaner). Managers run cleaning companies, create locations (buildings/sites), assign staff, and define tasks. Staff use a mobile app to check in via GPS, view tasks, complete them with photo evidence, and check out. An AI module verifies cleaning quality from uploaded photos.

**Target market:** Pakistani cleaning/facility management companies (5,000+ companies, 500K+ workers). Per-worker SaaS pricing model.

## Tech Stack

| Tech | Version | Purpose |
|---|---|---|
| Express | 5.x | HTTP framework |
| TypeScript | 5.x | Language |
| Prisma | 7.x | ORM (with `@prisma/adapter-pg`) |
| PostgreSQL | - | Database |
| Zod | 4.x | Request validation |
| bcrypt | 6.x | Password hashing |
| jsonwebtoken | 9.x | JWT auth |
| cookie-parser | 1.x | Cookie-based tokens |
| tsx | 4.x | Dev runner |

**Frontend (planned):** React Native (mobile app for staff), React.js (web dashboard for managers).

**ESM module system** - `"type": "module"` in package.json, imports use `.js` extensions.

## Project Structure

```
backend/
├── prisma.config.ts          # Prisma CLI config
├── prisma/
│   └── schema.prisma         # Database schema
└── src/
    ├── app.ts                # Express app + server startup
    ├── prisma/
    │   └── prisma.ts         # PrismaClient with pg adapter + auto-hash hooks
    ├── controllers/
    │   ├── manager.controller.ts
    │   └── staff.controller.ts
    ├── middlewares/
    │   ├── auth.middleware.ts      # JWT verification (verifyJwt)
    │   └── authorize.middleware.ts # Role check (manager-only)
    ├── routes/
    │   ├── manager.route.ts
    │   └── staff.route.ts
    ├── validations/
    │   ├── manager.validation.ts
    │   └── staff.validation.ts
    └── utils/
        ├── ApiError.ts       # Custom error with statusCode
        ├── ApiResponse.ts    # Standard { statusCode, data, message } wrapper
        └── auth.ts           # JWT + bcrypt helpers
```

## Database Schema (Prisma)

### Models

**Company** - A cleaning company. Has managers, staff, and locations.
- `id` (autoincrement), `name`, `isActive`, `createdAt`, `updatedAt`

**Manager** - Admin user who manages a company.
- `id`, `name`, `email` (unique), `password` (auto-hashed), `role` (MANAGER), `isActive`, `refreshToken`, `companyId`

**Staff** - Cleaning employee. Belongs to a company, optionally assigned to a location.
- `id`, `name`, `email` (unique), `password` (auto-hashed), `role` (STAFF), `isActive`, `refreshToken`, `companyId`, `locationId` (optional, SetNull on delete)

**Location** - A cleaning site/building with GPS coordinates for geo-fencing.
- `id`, `name`, `address`, `latitude` (Float), `longitude` (Float), `radiusMeters` (Int, default 100), `isActive`, `companyId`

**TaskTemplate** - Reusable task blueprint created by managers.
- `id`, `title`, `description`, `isActive`, `staffId` (optional), `locationId`, `shiftStart` (String "09:00"), `shiftEnd` (String), `recurringType` (DAILY/WEEKLY/MONTHLY/null), `recurringEndDate`

**TaskInstance** - Specific day's execution of a task (created by cron or on-demand).
- `id`, `templateId` (optional, SetNull), `title`, `date`, `shiftStart` (DateTime), `shiftEnd` (DateTime), `status`, `isLate`, `startedAt`, `completedAt`, `staffId`, `locationId`

### Enums
- `Role`: MANAGER, STAFF
- `TaskStatus`: PENDING, IN_PROGRESS, COMPLETED, LATE, MISSED
- `RecurringType`: DAILY, WEEKLY, MONTHLY

### Key Design Decisions
- **Soft deletes** - all models have `isActive`, never hard-delete
- **Template + Instance pattern** for tasks - templates define rules, instances are per-day snapshots
- **Separate Manager/Staff tables** (not one User table) - each has own role default
- **Auto password hashing** via Prisma `$extends` query hooks
- **No cascade deletes** - soft deletes handled in code
- **Location SetNull on Staff** - staff become unassigned if location is deactivated

## Geo-Fencing / Location Verification

### How It Works

Each Location stores GPS coordinates (`latitude`, `longitude`) and a `radiusMeters` (default 100m). When a staff member performs an action (check-in, task completion, check-out), the mobile app sends the worker's current GPS coordinates. The backend calculates the distance using the **Haversine formula** and verifies the worker is within the allowed radius.

### Why Not Exact Coordinates?

GPS is never exact. On a phone, accuracy is typically 5-20 meters (can be 50-100m indoors). So we use a **radius-based approach**:

- Manager creates a location and drops a pin on a map (or enters address, geocoded to lat/lng)
- System stores center coordinates + radius (e.g., 100 meters)
- When staff checks in or completes a task, app sends their GPS lat/lng
- Backend calculates distance between worker and location center
- If distance <= radiusMeters, action is allowed. Otherwise, rejected.

### Haversine Distance Formula (for backend)

```typescript
function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Usage in controller:
function isWithinRadius(
  workerLat: number, workerLng: number,
  locationLat: number, locationLng: number,
  radiusMeters: number
): boolean {
  const distance = getDistanceMeters(workerLat, workerLng, locationLat, locationLng);
  return distance <= radiusMeters;
}
```

### Recommended Radius Values
- **Small office / single floor:** 50-80 meters
- **Medium building / corporate office:** 100-150 meters
- **Large campus / hospital / mall:** 200-300 meters
- Manager can set custom radius per location

### Mobile App: Getting GPS Coordinates

In React Native, use `expo-location` or `react-native-geolocation-service`:

```typescript
import * as Location from 'expo-location';

async function getCurrentPosition() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission denied');

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy, // meters
  };
}
```

### Example API Flow: Task Completion with Geo-Verification

```
POST /api/staff/tasks/:taskId/complete
Body: { latitude: 33.6844, longitude: 73.0479, photo: <file> }

Backend:
1. Lookup task instance -> get locationId
2. Lookup location -> get lat, lng, radiusMeters
3. Calculate distance(worker coords, location coords)
4. If distance > radiusMeters -> reject with "You are not at the task location"
5. If within radius -> update task status to COMPLETED, save photo, set completedAt
```

## Authentication Flow

1. **Signup** (Manager only): Creates company + manager, returns access + refresh tokens in httpOnly cookies
2. **Login**: Validates password, generates tokens, stores refreshToken in DB
3. **Logout**: Clears cookies + nulls refreshToken
4. **Auth middleware** (`verifyJwt`): Reads token from cookie or Authorization header, verifies, looks up user based on role in JWT, attaches `req.user`
5. **Authorization** (`authorize`): Checks `req.user.role === "MANAGER"`

### Token Config
- Access token: 1 day expiry
- Refresh token: 10 days expiry
- httpOnly cookies (secure in production)
- No refresh token rotation endpoint yet

## API Routes

### Manager Routes (`/api/managers`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | None | Register manager + create company |
| POST | `/manager-login` | None | Login |
| POST | `/manager-logout` | JWT | Logout |
| POST | `/create-staff` | JWT + Manager | Create staff member |
| GET | `/staff` | JWT + Manager | List active staff |
| PATCH | `/staff/:id/deactivate` | JWT + Manager | Soft-delete staff |
| POST | `/create-location` | JWT + Manager | Create location (with lat, lng, radius) |
| GET | `/locations` | JWT + Manager | List active locations |
| PATCH | `/locations/:id/deactivate` | JWT + Manager | Soft-delete location + its tasks |

### Staff Routes (`/api/staff`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/staff-login` | None | Login |
| POST | `/staff-logout` | JWT | Logout |

### Planned Routes (Not Built Yet)
| Method | Path | Description |
|---|---|---|
| POST | `/api/managers/task-templates` | Create task template |
| GET | `/api/managers/task-templates` | List templates |
| PUT | `/api/managers/task-templates/:id` | Update template |
| DELETE | `/api/managers/task-templates/:id` | Deactivate template |
| GET | `/api/staff/tasks` | Get my today's tasks |
| POST | `/api/staff/tasks/:id/start` | Start a task (with GPS check) |
| POST | `/api/staff/tasks/:id/complete` | Complete task (with GPS + photo) |
| POST | `/api/staff/check-in` | GPS-verified attendance check-in |
| POST | `/api/staff/check-out` | GPS-verified check-out |

## Patterns & Conventions

- **Validation**: Zod `safeParse()` -> if fails, throw `ApiError(400)` with field errors
- **Error handling**: Throw `ApiError` anywhere -> global handler returns proper statusCode + message
- **Response format**: All responses use `ApiResponse(statusCode, data, message)`
- **Prisma client**: Single instance in `src/prisma/prisma.ts` with pg Pool adapter and bcrypt hooks
- **Soft delete**: Update `isActive: false`, all queries filter `isActive: true`
- **Cascading soft delete**: Deactivating a location also deactivates its tasks and unassigns staff

## Environment Variables (.env)

```
PORT=8080
DATABASE_URL=<postgres connection string>
NODE_ENV=local
ACCESS_TOKEN_SECRET=<secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<secret>
REFRESH_TOKEN_EXPIRY=10d
FRONTEND_URL=<for CORS>
```

## What's NOT Built Yet

- [ ] Task template CRUD (create, update, delete)
- [ ] Task instance creation (cron job for recurring tasks)
- [ ] Staff task actions (start, complete with GPS + photo)
- [ ] GPS check-in / check-out
- [ ] Location coordinates (latitude, longitude, radiusMeters fields)
- [ ] Geo-fencing verification utility
- [ ] Refresh token rotation endpoint
- [ ] File upload / photo storage
- [ ] AI cleaning verification module
- [ ] Push notifications / alerts
- [ ] React Native mobile app (staff)
- [ ] React.js web dashboard (manager)

## How to Run

```bash
npm install
npx prisma migrate dev
npx prisma generate
npx tsx src/app.ts
```
