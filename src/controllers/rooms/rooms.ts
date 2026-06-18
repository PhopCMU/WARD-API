import { AuditAction, AuditModule, PrismaClient } from "@prisma/client";
import { Context } from "elysia";
import { verifyToken } from "../../utils/verify_token";
import { getRequestInfo } from "../../utils/req_info";
import { logger } from "../../utils/logger";

const prisma = new PrismaClient();

type JwtContext = {
  verify: (token: string) => Promise<false | Record<string, unknown>>;
};

export const roomTypes = async ({
  request,
  jwt,
}: Context & { request: Request; jwt: JwtContext }) => {
  const requestInfo = getRequestInfo(request);

  const auth = await verifyToken(request, jwt);
  if (!auth.success) return auth.response;

  try {
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        name_th: true,
        name_en: true,
        roomType: true,
        color: true,
        _count: {
          select: {
            cages: true,
          },
        },
      },
    });
    logger.info("Fetched room types successfully", JSON.stringify(requestInfo));
    return new Response(JSON.stringify({ success: true, results: rooms }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(
      "Error fetching room types",
      error,
      JSON.stringify(requestInfo),
    );
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const addRoom = async ({
  body,
  request,
  jwt,
}: Context & {
  body: { name_th: string; name_en: string; roomType: string; color?: string };
  jwt: JwtContext;
}) => {
  const requestInfo = getRequestInfo(request);

  const auth = await verifyToken(request, jwt);
  if (!auth.success) return auth.response;

  const { name_th, name_en, roomType, color } = body;

  if (!name_th) {
    logger.warn(
      `Failed to add room: name_th is required. Request info: ${JSON.stringify(requestInfo)}`,
    );
    return new Response(
      JSON.stringify({ success: false, message: "Name (Thai) is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!name_en) {
    logger.warn(
      `Failed to add room: name_en is required. Request info: ${JSON.stringify(requestInfo)}`,
    );
    return new Response(
      JSON.stringify({ success: false, message: "Name (English) is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!roomType) {
    logger.warn(
      `Failed to add room: roomType is required. Request info: ${JSON.stringify(requestInfo)}`,
    );
    return new Response(
      JSON.stringify({ success: false, message: "roomType is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const newRoom = await prisma.room.create({
      data: {
        name_th,
        name_en,
        roomType: roomType as any,
        ...(color ? { color } : {}),
      } as any,
    });
    if (!newRoom) {
      logger.warn(
        "Failed to create room: No room returned from database",
        JSON.stringify({ name_th, name_en, roomType, color }),
      );
      return new Response(
        JSON.stringify({ success: false, message: "Failed to create room" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    logger.info(
      "Room created successfully",
      JSON.stringify({ name_th, name_en, roomType, color }),
    );

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        module: AuditModule.ROOM,
        action: AuditAction.CREATE,
        tableName: "rooms",
        recordId: newRoom.id,
        oldData: undefined,
        newData: {
          name_th,
          name_en,
          roomType,
          color,
        },
        metadata: undefined,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent ?? null,
      },
    });

    return new Response(JSON.stringify({ success: true, results: newRoom }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(
      "Error adding room",
      error,
      JSON.stringify({ name_th, name_en, roomType, color }),
    );
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const updateRoom = async ({
  query,
  request,
  jwt,
}: Context & {
  query: {
    data: string;
  };
  request: Request;
  jwt: any;
}) => {
  const requestInfo = getRequestInfo(request);

  const auth = await verifyToken(request, jwt);
  if (!auth.success) return auth.response;

  const data = decodeURIComponent(query.data);
  const parsedData = JSON.parse(data);

  const { id, name_th, name_en, roomType, color } = parsedData;

  if (!id) {
    logger.warn(
      `Failed to update room: id is required. Request info: ${JSON.stringify(requestInfo)}`,
    );
    return new Response(
      JSON.stringify({ success: false, message: "Room ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const existingRoom = await prisma.room.findUnique({ where: { id } });
    if (!existingRoom) {
      logger.warn(
        `Failed to update room: Room with ID ${id} not found. Request info: ${JSON.stringify(requestInfo)}`,
      );
      return new Response(
        JSON.stringify({ success: false, message: "Room not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        id,
        name_th: name_th,
        name_en: name_en,
        roomType: roomType,
        color: color,
      },
    });

    logger.info(
      `Room updated successfully: ${JSON.stringify(updatedRoom)}. Request info: ${JSON.stringify(requestInfo)}`,
    );

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        module: AuditModule.ROOM,
        action: AuditAction.UPDATE,
        tableName: "rooms",
        recordId: updatedRoom.id,
        oldData: existingRoom,
        newData: updatedRoom,
        metadata: undefined,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent ?? null,
      },
    });

    return new Response(
      JSON.stringify({ success: true, results: updatedRoom }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logger.error(
      "Error updating room",
      error,
      JSON.stringify({ id, name_th, name_en, roomType, color }),
    );
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const deleteRoom = async ({
  query,
  request,
  jwt,
}: Context & {
  query: {
    id: string;
  };
  request: Request;
  jwt: any;
}) => {
  const requestInfo = getRequestInfo(request);

  const auth = await verifyToken(request, jwt);
  if (!auth.success) return auth.response;

  const roomId = query.id;

  if (!roomId) {
    logger.warn(
      `Failed to delete room: id is required. Request info: ${JSON.stringify(requestInfo)}`,
    );
    return new Response(
      JSON.stringify({ success: false, message: "Room ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      logger.warn(
        `Failed to delete room: Room with ID ${roomId} not found. Request info: ${JSON.stringify(requestInfo)}`,
      );
      return new Response(
        JSON.stringify({ success: false, message: "Room not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    await prisma.room.delete({ where: { id: roomId } });

    logger.info(
      `Room deleted successfully: ID ${roomId}. Request info: ${JSON.stringify(requestInfo)}`,
    );

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        module: AuditModule.ROOM,
        action: AuditAction.DELETE,
        tableName: "rooms",
        recordId: roomId,
        oldData: existingRoom,
        newData: undefined,
        metadata: undefined,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent ?? null,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error deleting room", error, JSON.stringify({ id: roomId }));
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
