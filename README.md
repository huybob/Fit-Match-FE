# Base NextJS FE

Enterprise-style frontend starter using Next.js App Router, TypeScript, feature-first modules, clean boundaries, DTOs, repositories, services, API clients, React Query, Zustand, Zod, and Axios.

This repository is frontend-only. It does not include internal Next API routes, ORM code, Prisma, or backend persistence. The User module runs with a mock repository by default so FE work can start before backend APIs are ready.

## Run

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
http://localhost:3000/users
```

## API Mode

Mock mode is enabled by default:

```env
NEXT_PUBLIC_USE_MOCK_API=true
```

To call a real backend:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

The User HTTP adapter calls:

```txt
GET  /users
GET  /users/:id
POST /users
```

## Structure

```txt
src/
|-- app/                    # Next.js App Router pages/layouts only
|-- core/                   # app-wide FE infrastructure: config, http, providers, auth
|-- modules/                # feature modules / bounded contexts
|   `-- user/
|       |-- domain/         # entity, value object, repository interface, domain errors
|       |-- application/    # services, DTOs, mappers, validators
|       |-- infrastructure/ # API client, repository adapters, query keys
|       `-- presentation/   # hooks, components, stores, view models
|-- shared/                 # common UI, types, utils, constants, errors
`-- middleware/             # optional FE route guard handlers composed by src/proxy.ts
```

## Dependency Rules

- `domain` does not import React, Next.js, Axios, Zustand, or React Query.
- `application` depends on `domain`, DTOs, validators, and mappers.
- `infrastructure` implements repository interfaces and talks to external APIs/tools.
- `presentation` owns React components, hooks, view models, and module-local stores.
- `app` imports module public APIs from `src/modules/[module]/index.ts`.
- `shared` stays generic and must not depend on a concrete business module.

## File Naming

Use `kebab-case` plus role suffixes:

```txt
user.entity.ts
email.vo.ts
user.repository.interface.ts
user-http.repository.ts
user-memory.repository.ts
user.service.ts
create-user.request.dto.ts
user.response.dto.ts
user.view-model.ts
user.schema.ts
use-users.ts
user-table.tsx
```

## Add A New Module

Copy this shape:

```txt
src/modules/[module-name]/
|-- domain/
|   |-- entities/
|   |-- value-objects/
|   |-- repositories/
|   |-- services/
|   `-- errors/
|-- application/
|   |-- services/
|   |-- dto/
|   |   |-- request/
|   |   `-- response/
|   |-- mappers/
|   `-- validators/
|-- infrastructure/
|   |-- api/
|   |-- repositories/
|   `-- query/
|-- presentation/
|   |-- components/
|   |-- hooks/
|   |-- mappers/
|   |-- stores/
|   `-- view-models/
`-- index.ts
```

## FE Best Practices

- Keep pages thin. Route files should compose module components, not contain business logic.
- Keep server-only dependencies out of modules. This base is designed to run as a frontend shell.
- Use DTOs for API contracts, entities for business rules, and view models for UI formatting.
- Put API shape changes inside infrastructure mappers/adapters, not inside React components.
- Expose each module through `index.ts` and avoid deep imports across modules.
- Keep mock repositories close to real repository contracts so screens can be built before backend delivery.
