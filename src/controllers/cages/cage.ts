import {
  AuditAction,
  AuditModule,
  CageType,
  PrismaClient,
} from "@prisma/client";
import { Context } from "elysia";
import { getRequestInfo } from "../../utils/req_info";
import { verifyToken } from "../../utils/verify_token";
import { logger } from "../../utils/logger";

const prisma = new PrismaClient();

const getCageWeightRange = (
  cageType: CageType,
): { minWeightKg: number | null; maxWeightKg: number | null } => {
  switch (cageType) {
    case CageType.PAVILION:
      return { minWeightKg: 0, maxWeightKg: 8 };
    case CageType.UNDER_10KG:
      return { minWeightKg: 0, maxWeightKg: 10 };
    case CageType.KG_10_TO_20:
      return { minWeightKg: 10, maxWeightKg: 20 };
    case CageType.OVER_20KG:
      return { minWeightKg: 20, maxWeightKg: null };
    case CageType.UNLIMITED:
      return { minWeightKg: null, maxWeightKg: null };
  }
};

type JwtContext = {
  verify: (token: string) => Promise<false | Record<string, unknown>>;
};

export const cageTypes = async ({
  request,
  jwt,
}: Context & { request: Request; jwt: JwtContext }) => {
  const requestInfo = getRequestInfo(request);

  const auth = await verifyToken(request, jwt);
  if (!auth.success) return auth.response;

  try {
    const cages = await prisma.cage.findMany();

    logger.info("Fetched cage types successfully", JSON.stringify(requestInfo));
    return new Response(JSON.stringify({ success: true, results: cages }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error fetching cage types", JSON.stringify(requestInfo));
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const addCage = async ({
  body,
  request,
  jwt,
}: Context & {
  body: {
    cageType: string;
    code: string;
    hasOxygen: boolean;
    roomId: string;
    status: boolean;
  };
  request: Request;
  jwt: JwtContext;
}) => {
  const requestInfo = getRequestInfo(request);

  const auth = await verifyToken(request, jwt);
  if (!auth.success) return auth.response;

  try {
    const existingCage = await prisma.cage.findUnique({
      where: { code: body.code },
    });

    if (existingCage) {
      logger.warn(
        "Attempted to add a cage with an existing code",
        JSON.stringify(requestInfo),
      );
      return new Response(
        JSON.stringify({ success: false, message: "Cage code already exists" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: body.roomId },
    });

    if (!room) {
      logger.warn(
        "Attempted to add a cage to a non-existent room",
        JSON.stringify(requestInfo),
      );
      return new Response(
        JSON.stringify({ success: false, message: "Room does not exist" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { cageType, code, hasOxygen, roomId, status } = body;
    const { minWeightKg, maxWeightKg } = getCageWeightRange(
      cageType as CageType,
    );

    const newCage = await prisma.cage.create({
      data: {
        cageType: cageType as CageType,
        code,
        hasOxygen,
        roomId,
        status,
        minWeightKg,
        maxWeightKg,
      },
    });

    logger.info("Added new cage successfully", JSON.stringify(requestInfo));

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        module: AuditModule.CAGE,
        action: AuditAction.CREATE,
        tableName: "cages",
        recordId: newCage.id,
        oldData: undefined,
        newData: {
          cageType,
          code,
          hasOxygen,
          roomId,
          status,
          minWeightKg,
          maxWeightKg,
        },
        metadata: undefined,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent ?? null,
      },
    });

    return new Response(JSON.stringify({ success: true, results: newCage }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error adding new cage", JSON.stringify(requestInfo));
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const updateCage = async ({
  query,
  request,
  jwt,
}: {
  query: {
    data: string;
  };
  request: Request;
  jwt: JwtContext;
}) => {
  const requestInfo = getRequestInfo(request);

  const auth = await verifyToken(request, jwt);
  if (!auth.success) return auth.response;

  const data = decodeURIComponent(query.data);
  const parsedData = JSON.parse(data);

  try {
    const { id, cageType, code, hasOxygen, roomId, status } = parsedData;

    const existingCage = await prisma.cage.findUnique({
      where: { id },
    });

    if (!existingCage) {
      logger.warn(
        "Attempted to update a non-existent cage",
        JSON.stringify(requestInfo),
      );
      return new Response(
        JSON.stringify({ success: false, message: "Cage does not exist" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const updatedCage = await prisma.cage.update({
      where: { id },
      data: {
        cageType: cageType as CageType,
        code,
        hasOxygen,
        roomId,
        status,
        ...(cageType && getCageWeightRange(cageType as CageType)),
      },
    });

    logger.info("Updated cage successfully", JSON.stringify(requestInfo));

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        module: AuditModule.CAGE,
        action: AuditAction.UPDATE,
        tableName: "cages",
        recordId: updatedCage.id,
        oldData: existingCage,
        newData: {
          cageType,
          code,
          hasOxygen,
          roomId,
          status,
          minWeightKg: updatedCage.minWeightKg,
          maxWeightKg: updatedCage.maxWeightKg,
        },
        metadata: undefined,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent ?? null,
      },
    });

    return new Response(
      JSON.stringify({ success: true, results: updatedCage }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logger.error("Error updating cage", JSON.stringify(requestInfo));
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
