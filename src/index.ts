import { Context, Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { logger } from "./utils/logger";
import { cmuItAccountRouter } from "./router/cmu_it_account";
import { roomRouter } from "./router/rooms";
import path from "path";
import { promises as fs } from "fs";
import mime from "mime-types";
import { cageRouter } from "./router/cage";

if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is missing in environment variables!");
}

const PORT = Number(process.env.PORT ?? import.meta.env?.PORT ?? 3000);

// CORS: allow configuring via env, and ensure credentials isn't true when origin is '*'
let corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["*"];
let corsCredentials = process.env.CORS_CREDENTIALS
  ? process.env.CORS_CREDENTIALS === "true"
  : true;
if (corsOrigin.includes("*") && corsCredentials) {
  logger.warn(
    'CORS: origin="*" incompatible with credentials=true; disabling credentials',
  );
  corsCredentials = false;
}

const app = new Elysia({ prefix: "/ward/api/v1" })

  .use(
    swagger({
      documentation: {
        info: {
          title: "Ward API",
          version: "1.0.0",
          description: "Ward API Documentation",
        },
      },
      swaggerOptions: {
        persistAuthorization: true, // จำข้อมูลการ authenticate
        displayOperationId: true, // แสดง operationId ใน UI
        tryItOutEnabled: true, // เปิดใช้งาน "Try it out" สำหรับทดสอบ API
        docExpansion: "list",
      },
    }),
  )
  .use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: corsCredentials,
    }),
  )
  .get("/uploads/*", async ({ params }: any) => {
    const relativePath = params["*"] || ""; // ดึง path หลัง /uploads/

    const base = path.resolve(process.cwd(), "uploads");
    const resolved = path.resolve(base, relativePath);
    const baseWithSep = base.endsWith(path.sep) ? base : base + path.sep;

    try {
      // Resolve symlinks to final real path and ensure it is inside uploads
      const real = await fs.realpath(resolved);
      if (real !== base && !real.startsWith(baseWithSep)) {
        return new Response("Forbidden", { status: 403 });
      }

      const stat = await fs.stat(real);
      if (!stat.isFile()) return new Response("Not Found", { status: 404 });

      const contentType = mime.lookup(real) || "application/octet-stream";
      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
      };

      return new Response(Bun.file(real), { headers });
    } catch (err) {
      return new Response("File not found", { status: 404 });
    }
  })

  //=======================================================================
  // ตัวอย่าง route พื้นฐานสำหรับตรวจสอบว่า API ทำงานได้หรือไม่
  //=======================================================================
  .get("/", ({ request }: Context & { request: any }) => ({
    IP: request.headers.get("x-forwarded-for") || "127.0.0.1",
    year: new Date().getFullYear(),
    status: "ok",
    runtime: "Congratulations! Your Ward API is running successfully.",
  }))
  //=======================================================================
  // เพิ่ม router สำหรับ CMU IT account authentication
  .use(cmuItAccountRouter) // เพิ่ม router สำหรับ CMU IT account authentication
  .use(roomRouter) // เพิ่ม router สำหรับ room
  .use(cageRouter) // เพิ่ม router สำหรับ cage

  //=======================================================================

  .onError((error) => {
    logger.error("Unhandled error in request handler", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  });
app.listen(PORT);

logger.info(
  `🦊 Ward API running at ${app.server?.hostname}:${app.server?.port}`,
);
