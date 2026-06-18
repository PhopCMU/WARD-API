import Elysia, { t } from "elysia";
import { authCmuItAccount } from "../controllers/auth_cmu_it_account";
import { jwtPlugin } from "../plugins/jwt";

export const cmuItAccountRouter = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin);

cmuItAccountRouter.post("/exchange-code", authCmuItAccount, {
  body: t.Object({ code: t.String() }),
  tags: ["Admin"],
});
