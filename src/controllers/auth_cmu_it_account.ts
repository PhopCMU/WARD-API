import { Context } from "elysia";
import { logger } from "../utils/logger";
import { PrismaClient } from "@prisma/client";
import { getRequestInfo } from "../utils/req_info";

const prisma = new PrismaClient();

const authCmuItAccount = async ({
  body,
  request,
  set,
}: Context & { request: Request }) => {
  const requestInfo = getRequestInfo(request);

  try {
    logger.info("Authenticating CMU IT account...");
  } catch (error) {
    logger.error(`Error authenticating CMU IT account: ${error}`);
    return new Response(
      JSON.stringify({ success: false, message: "Authentication failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export { authCmuItAccount };
