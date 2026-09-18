import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, supportOffers } from "@workspace/db";

const router: IRouter = Router();

router.get("/support-offers", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(supportOffers)
      .orderBy(desc(supportOffers.createdAt));

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/support-offers failed", error);
    return res.status(500).json({
      message: "Unable to load support offers",
    });
  }
});

export default router;
