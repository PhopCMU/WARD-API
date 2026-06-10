# Ward API — AGENTS.md

## Project Overview
Ward API is a **Bun + ElysiaJS** REST API using **Prisma ORM** with MySQL.

## Tech Stack
- **Runtime**: Bun
- **Framework**: ElysiaJS v1.4+
- **ORM**: Prisma v7 (prisma-client-js, MySQL)
- **Auth**: @elysiajs/jwt
- **Logging**: Winston
- **Crypto**: crypto-js
- **Bot**: grammy (Telegram)
- **Email**: nodemailer
- **HTTP Client**: axios
- **Docs**: @elysiajs/swagger

## Architecture: Feature-based MVC
Each feature lives in `src/modules/<feature>/` with three files:
- `model.ts` — TypeBox schemas + derived types
- `service.ts` — `abstract class` with `static` methods, business logic
- `index.ts` — Elysia controller, routes only

## Key Conventions
- Services return `status()` from `elysia` for errors — never throw
- Password hashing: `CryptoJS.SHA256(password).toString()`
- JWT secret from `Bun.env.JWT_SECRET`
- Always chain Elysia methods — never reassign
- Name plugins: `new Elysia({ name: "..." })` to prevent re-execution
- Add new modules to `src/index.ts` via `.use(module)`

## Database
- Prisma with MySQL
- Schema at `prisma/schema.prisma`
- Run `bunx prisma migrate dev` for migrations
- Run `bunx prisma generate` after schema changes

## Dev Commands
```bash
bun run dev               # Hot-reload dev server
bunx prisma migrate dev   # Apply migrations
bunx prisma studio        # GUI database browser
```
