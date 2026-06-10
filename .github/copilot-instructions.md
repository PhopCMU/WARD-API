# Ward API — Project Guidelines for GitHub Copilot

## Project Overview
Ward API is a **Bun + ElysiaJS** REST API using **Prisma ORM** with MySQL. It follows a **feature-based MVC pattern**.

## Tech Stack
- **Runtime**: Bun
- **Framework**: ElysiaJS v1.4+
- **ORM**: Prisma v7 (MySQL)
- **Auth**: @elysiajs/jwt (JWT tokens)
- **Logging**: Winston
- **Crypto**: crypto-js (SHA256 password hashing)
- **Bot**: grammy (Telegram bot)
- **Email**: nodemailer
- **HTTP Client**: axios
- **Docs**: @elysiajs/swagger (auto-generated OpenAPI)

## Folder Structure
```
src/
├── index.ts              # Server entry — register all modules here
├── modules/              # Feature modules (domain-driven)
│   ├── <feature>/
│   │   ├── index.ts      # Elysia controller — routes, validation, HTTP only
│   │   ├── service.ts    # Business logic — abstract class with static methods
│   │   └── model.ts      # TypeBox schemas + exported static types
├── plugins/
│   └── prisma.ts         # PrismaClient singleton + Elysia `db` plugin
└── utils/
    └── logger.ts         # Winston logger instance

prisma/
└── schema.prisma         # Database schema (MySQL)

public/                   # Static files served by @elysiajs/static
logs/                     # Log files (auto-created by winston)
```

## Coding Conventions

### Controllers (`modules/<feature>/index.ts`)
- Use `new Elysia({ prefix: "/feature" })` and export as named const
- Register models via `.model({ ...FeatureModel })`
- Reference models by string name: `body: "modelName"`
- Handle HTTP concerns only — delegate logic to Service
- Use `onError` for local error handling when needed

### Services (`modules/<feature>/service.ts`)
- Always `abstract class` with `static` methods
- Import types from `./model`
- Use `import { status } from "elysia"` for error returns (not `throw`)
- Return `status(404, "message")` for not-found, `status(409, ...)` for conflict

### Models (`modules/<feature>/model.ts`)
- Export a plain object of TypeBox schemas (e.g., `export const AuthModel = { ... }`)
- Always export `type` derived from `schema.static` for each model
- Custom error types belong in the model file

### Prisma Plugin (`plugins/prisma.ts`)
- Single `PrismaClient` instance exported as `default prisma`
- Elysia plugin `db` decorates context with `db` for controller use

## Important Rules
- **Method chain Elysia** — never reassign `app.something()`, always chain
- **Scope lifecycle** — hooks are `local` by default; use `{ as: 'global' }` only for CORS/logging
- **Named plugins** — use `new Elysia({ name: "plugin-name" })` to prevent duplicate execution
- **Password hashing** — always use `CryptoJS.SHA256(password).toString()`
- **JWT secret** — read from `Bun.env.JWT_SECRET`
- **Never commit `.env`** — use `.env.example` as reference

## Adding a New Module
1. Create `src/modules/<feature>/model.ts` — define TypeBox schemas and export types
2. Create `src/modules/<feature>/service.ts` — abstract class with static methods
3. Create `src/modules/<feature>/index.ts` — Elysia controller with prefix
4. Register in `src/index.ts` via `.use(featureModule)`

## Scripts
```bash
bun run dev          # Start dev server with hot reload
bunx prisma migrate dev   # Run database migrations
bunx prisma studio        # Open Prisma Studio GUI
bunx prisma generate      # Regenerate Prisma client
```
