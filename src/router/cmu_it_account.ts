import Elysia, { t } from "elysia";
import { authCmuItAccount } from "../controllers/auth_cmu_it_account";

export const cmuItAccountRouter = new Elysia({ prefix: "/cmu-it-account" });

cmuItAccountRouter.post("/exchange-code", authCmuItAccount, {
  body: t.Object({ code: t.String() }),
  tags: ["Admin"],
});
