import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, notifications } from "@workspace/db";

const router: IRouter = Router();

router.get("/notifications", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/notifications failed", error);
    return res.status(500).json({
      message: "Unable to load notifications",
    });
  }
});

export default router;
