# MySQL Migration Preparation

This project currently runs with Supabase SDK calls directly in frontend contexts/components. Moving to MySQL requires a backend API layer (frontend must not hold DB credentials).

## Current readiness in this repo

- Login UI is already role-agnostic (single identifier + password).
- Auth auto-detect order in app:
  1. `admin@o2.cz`
  2. booth login
  3. participant login
- Backend mode variables prepared:
  - `VITE_BACKEND_MODE` (`supabase` | `mysql_api`)
  - `VITE_MYSQL_API_BASE_URL`
- MySQL auth API client added in frontend:
  - `src/lib/api/mysqlAuthApi.ts`
- MySQL schema prepared:
  - `migration/mysql/schema.mysql.sql`

## Backend API contract required for full migration

Minimal endpoints needed to replace all Supabase calls:

- `POST /auth/login`
- `POST /auth/logout`
- `GET /bootstrap` (users, booths, program, settings, banners, phones, winners)
- `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`
- `GET /booths`, `POST /booths`, `PATCH /booths/:id`, `DELETE /booths/:id`
- `GET /program`, `POST /program`, `PATCH /program/:id`, `DELETE /program/:id`
- `POST /visits`, `PATCH /visits/answer`, `DELETE /visits/reset`
- `GET /final-votes`, `POST /final-votes`, `DELETE /final-votes/reset`
- `GET /winners`, `POST /winners`, `DELETE /winners/reset`
- `GET /notifications`, `POST /notifications`
- `GET /banners`, `POST /banners`, `PATCH /banners/:id`, `DELETE /banners/:id`
- `GET /settings`, `PATCH /settings/:key`

## Environment setup

Frontend (`.env`):

```env
VITE_BACKEND_MODE=supabase
VITE_MYSQL_API_BASE_URL=http://localhost:8080
```

Backend (`.env`):

```env
MYSQL_HOST=10.42.178.106
MYSQL_PORT=3306
MYSQL_DATABASE=bi
MYSQL_USER=biapp
MYSQL_PASSWORD=***
JWT_SECRET=***
```

## Recommended migration order

1. Deploy backend API with MySQL using `migration/mysql/schema.mysql.sql`.
2. Implement `/auth/login` first and verify login flows.
3. Implement `/bootstrap` + read endpoints.
4. Switch DataContext reads from Supabase to API.
5. Switch write endpoints (admin CRUD, visits, final votes).
6. Remove Supabase SDK and keys from frontend only after parity tests pass.
