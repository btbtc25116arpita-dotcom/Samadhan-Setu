import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, teams } from "@workspace/db";

const router: IRouter = Router();

router.get("/teams", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(teams)
      .orderBy(desc(teams.createdAt));

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/teams failed", error);
    return res.status(500).json({
      message: "Unable to load teams",
    });
  }
});

export default router;
