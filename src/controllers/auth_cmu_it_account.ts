import { Context } from "elysia";
import { logger } from "../utils/logger";
import { AuditAction, AuditModule, PrismaClient } from "@prisma/client";
import { getRequestInfo } from "../utils/req_info";

const prisma = new PrismaClient();

const authCmuItAccount = async ({
  body,
  request,
  jwt,
}: Context & { request: Request; body: { code: string }; jwt: any }) => {
  const requestInfo = getRequestInfo(request);

  console.debug(body.code);
  console.debug(requestInfo);

  // ตรวจสอบว่า code มีค่าและไม่เป็นค่าว่างหรือไม่
  if (!body.code) {
    logger.warn(
      `Authentication failed: code is required. Request info: ${JSON.stringify(requestInfo)}`,
    );
    return new Response(
      JSON.stringify({ success: false, message: "Code is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // ตรวจสอบว่า code เป็น string หรือไม่
  if (typeof body.code !== "string") {
    logger.warn(
      `Authentication failed: code must be a string. Request info: ${JSON.stringify(requestInfo)}`,
    );
    return new Response(
      JSON.stringify({ success: false, message: "Code must be a string" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;
    const tokenEndpoint = process.env.TOKEN_URI;
    const scope = process.env.SCOPE;

    // ตรวจสอบว่าค่าต่าง ๆ ที่จำเป็นสำหรับการทำ OAuth มีครบถ้วนหรือไม่
    if (
      !clientId ||
      !clientSecret ||
      !redirectUri ||
      !tokenEndpoint ||
      !scope
    ) {
      logger.error(
        `Authentication failed: Missing CMU IT OAuth configuration. Request info: ${JSON.stringify(requestInfo)}`,
      );
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const options = {
      code: body.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope,
    };

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(options),
    });

    const tokenData = await tokenResponse.json();

    const accessToken = tokenData.access_token;

    // ตรวจสอบว่าได้รับ access token หรือไม่
    if (!accessToken) {
      logger.error(
        `Authentication failed: No access token received. Response: ${JSON.stringify(tokenData)}. Request info: ${JSON.stringify(requestInfo)}`,
      );
      return new Response(
        JSON.stringify({ success: false, message: "Authentication failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const userInfoResponse = await fetch(process.env.BASICINFO_URL!, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfo) {
      logger.error(
        `Authentication failed: Invalid user info received. Response: ${JSON.stringify(userInfo)}. Request info: ${JSON.stringify(requestInfo)}`,
      );
      return new Response(
        JSON.stringify({ success: false, message: "Authentication failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    } else if (userInfo.organization_code !== "14") {
      logger.warn(
        `Authentication failed: User does not belong to the required organization. Response: ${JSON.stringify(userInfo)}. Request info: ${JSON.stringify(requestInfo)}`,
      );
      return new Response(
        JSON.stringify({ success: false, message: "Authentication failed" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const role = userInfo.cmuitaccount_name === "sophon.m" ? "ADMIN" : "USER";
    const newDate = new Date();
    const year = newDate.getFullYear() + 1; // ปี ค.ศ.
    const day = pad2(newDate.getDate()); // วันในสัปดาห์ (0-6)
    const month = pad2(newDate.getMonth() + 1); // เดือน (0-11)
    const minute = pad2(newDate.getMinutes()); // นาที (0-59)
    const second = pad2(newDate.getSeconds()); // วินาที (0-59)

    const coverDate = `${day}${month}${minute}${second}`;
    const cmuId = `CMU-${role === "ADMIN" ? "00" : "01"}-${coverDate}-${year}`;

    const user = await prisma.cmuItAccount.upsert({
      where: { email: userInfo.cmuitaccount },
      update: {
        updatedAt: now,
      },
      create: {
        cmuId,
        email: userInfo.cmuitaccount,
        name: userInfo.firstname_TH + " " + userInfo.lastname_TH,
        role,
        updatedAt: now,
      },
      select: {
        id: true,
        cmuId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Sign a new JWT and persist it (replaces previous token on every login)
    const token = await jwt.sign({
      // id: user.id,
      cmuItAccount: user.email.split("@")[0], // ใช้เฉพาะส่วนก่อน @ เป็นข้อมูลใน token
      name: user.name,
      // role: user.role,
    });
    await prisma.cmuItAccount.update({
      where: { id: user.id },
      data: { token },
    });

    logger.info(
      `User authenticated successfully: ${user.email}. Request info: ${JSON.stringify(requestInfo)}`,
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        module: AuditModule.AUTH,
        action: AuditAction.LOGIN,
        tableName: "cmu_it_accounts",
        recordId: user.id,
        newData: {
          email: user.email,
          name: user.name,
          role: user.role,
          updatedAt: now,
        },
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent ?? null,
      },
    });

    return new Response(JSON.stringify({ success: true, token, user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`Error authenticating CMU IT account: ${error}`);
    return new Response(
      JSON.stringify({ success: false, message: "Authentication failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export { authCmuItAccount };
