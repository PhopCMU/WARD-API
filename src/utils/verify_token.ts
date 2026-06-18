import { PrismaClient, CmuItAccount } from "@prisma/client";

const prisma = new PrismaClient();

type JwtVerifier = {
  verify: (token: string) => Promise<false | Record<string, unknown>>;
};

type VerifyTokenResult =
  | { success: true; user: CmuItAccount; token: string }
  | { success: false; response: Response };

/**
 * ตรวจสอบ JWT token จาก Authorization header และเทียบกับ token ที่บันทึกใน DB
 * @returns VerifyTokenResult — success: true พร้อม user / success: false พร้อม Response 401
 */
export async function verifyToken(
  request: Request,
  jwt: JwtVerifier,
): Promise<VerifyTokenResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized: token required",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  const token = authHeader.slice(7);

  const payload = await jwt.verify(token);

  if (!payload || typeof payload.cmuItAccount !== "string") {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized: invalid token",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  const nameAccount = `${payload.cmuItAccount ?? ""}`;

  const user = await prisma.cmuItAccount.findUnique({
    where: { email: nameAccount + "@cmu.ac.th" },
  });

  if (!user || user.token !== token) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized: session invalid",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  return { success: true, user, token };
}
