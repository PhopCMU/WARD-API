import { jwt } from "@elysiajs/jwt";
import Elysia from "elysia";

export const jwtPlugin = new Elysia({ name: "jwt-plugin" }).use(
  jwt({
    name: "jwt",
    secret: Bun.env.JWT_SECRET!,
    exp: (Bun.env.JWT_EXPIRATION as string) || "3600s",
  }),
);
