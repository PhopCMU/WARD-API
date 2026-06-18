import Elysia, { t } from "elysia";
import { addCage, cageTypes, updateCage } from "../controllers/cages/cage";
import { jwtPlugin } from "../plugins/jwt";

export const cageRouter = new Elysia({ prefix: "/cage" }).use(jwtPlugin);

cageRouter.get("/cages", cageTypes, {
  tags: ["Cage"],
});

cageRouter.post("/add", addCage, {
  body: t.Object({
    cageType: t.String(),
    code: t.String(),
    hasOxygen: t.Boolean(),
    roomId: t.String(),
    status: t.Boolean(),
  }),
  tags: ["Cage"],
});

cageRouter.put("/update", updateCage, {
  query: t.Object({
    data: t.String(),
  }),
  tags: ["Cage"],
});
