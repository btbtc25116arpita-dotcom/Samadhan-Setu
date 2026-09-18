import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, industryPartners } from "@workspace/db";

const router: IRouter = Router();

router.get("/industry-partners", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(industryPartners)
      .orderBy(desc(industryPartners.createdAt));

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/industry-partners failed", error);
    return res.status(500).json({
      message: "Unable to load industry partners",
    });
  }
});

export default router;
