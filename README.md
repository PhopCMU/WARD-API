# Ward API

Ward API คือ REST API สร้างด้วย **Bun + ElysiaJS** พร้อม **Prisma ORM** (MySQL)

## Tech Stack
| Package | Purpose |
|---|---|
| `elysia` | Web framework |
| `@elysiajs/cors` | CORS middleware |
| `@elysiajs/jwt` | JWT authentication |
| `@elysiajs/swagger` | OpenAPI docs |
| `@elysiajs/static` | Static file serving |
| `@prisma/client` / `prisma` | ORM (MySQL) |
| `winston` | Logging |
| `crypto-js` | Password hashing (SHA256) |
| `grammy` | Telegram bot integration |
| `nodemailer` | Email sending |
| `axios` | HTTP client |
| `qs` | Query string parsing |

## Project Structure
```
src/
├── index.ts              # Entry point
├── modules/
│   ├── auth/             # Authentication
│   └── user/             # User management
├── plugins/
│   └── prisma.ts         # DB plugin
└── utils/
    └── logger.ts         # Winston logger
prisma/
└── schema.prisma
```

## Getting Started

```bash
# Copy and configure environment
cp .env.example .env

# Run database migration
bunx prisma migrate dev

# Start development server
bun run dev
```

## API Documentation
Visit http://localhost:3000/swagger for interactive API docs.
