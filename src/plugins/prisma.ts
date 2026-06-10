import { PrismaClient } from "@prisma/client";
import Elysia from "elysia";

const prisma = new PrismaClient();

export const db = new Elysia({ name: "db" }).decorate("db", prisma);

export default prisma;
