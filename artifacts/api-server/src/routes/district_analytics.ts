import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, districtAnalytics } from "@workspace/db";

const router: IRouter = Router();

router.get("/district-analytics", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(districtAnalytics)
      .orderBy(desc(districtAnalytics.createdAt));

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/district-analytics failed", error);
    return res.status(500).json({
      message: "Unable to load district analytics",
    });
  }
});

export default router;
