import Elysia, { t } from "elysia";
import {
  addRoom,
  deleteRoom,
  roomTypes,
  updateRoom,
} from "../controllers/rooms/rooms";
import { jwtPlugin } from "../plugins/jwt";

const roomRouter = new Elysia({ prefix: "/room" }).use(jwtPlugin);

roomRouter.get("/rooms", roomTypes, {
  tags: ["Room"],
});

roomRouter.post("/add", addRoom, {
  body: t.Object({
    name_th: t.String(),
    name_en: t.String(),
    roomType: t.String(),
    color: t.Optional(t.String()),
  }),
  tags: ["Room"],
});

roomRouter.put("/update", updateRoom, {
  query: t.Object({
    data: t.String(),
  }),
  tags: ["Room"],
});

roomRouter.delete("/delete", deleteRoom, {
  query: t.Object({
    id: t.String(),
  }),
  tags: ["Room"],
});

export { roomRouter };
