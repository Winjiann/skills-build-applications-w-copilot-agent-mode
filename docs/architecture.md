# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. Its API contracts and tests define expected behavior across presentation, logic, and data responsibilities.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Implementation decisions:

- Presentation tier decision: Keep API-backed rendering in each capability component and use the shared API client, with accessible loading, empty, and error states.
- Logic tier decision: Keep route handlers thin and implement validation and business behavior in the existing service functions, returning deliberate 4xx errors for invalid input.
- Data tier decision: Enforce required model fields and defaults in Mongoose without changing the seed script's non-destructive, idempotent upsert behavior.
- Activity tracking approach: Validate IDs, references, type, and positive minutes before creating an activity; calculate points from minutes and set the occurrence time on the server.
- Team management approach: Require a non-empty name and valid optional member references; rely on the model's default empty members array.
- Leaderboard approach: Sum activity points per team, include teams with no activity at zero, and assign ranks after sorting by points.
- Workout suggestions approach: Find the user by email, prefer workouts matching their goal and then recent activity, and include a reason with each suggestion.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — passed (5 tests).
- API command: `npm run test:api --prefix octofit-tracker/backend` — passed (4 tests).
- Frontend command: `npm test --prefix octofit-tracker/frontend` — passed (15 tests).
- Backend build command: `npm run build --prefix octofit-tracker/backend` — passed.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — passed.
- Scaffold validation: `node .github/scripts/validate-exercise.mjs` — failed on existing template/workflow contract issues, including the README copy badge and a missing `.github/steps/2-step.md`; these are outside the application implementation.
- Exercise validation tests: `node --test tests/exercise-validation.test.mjs` — failed on existing validator/template expectations, including the README copy badge contract; these are outside the application implementation.
