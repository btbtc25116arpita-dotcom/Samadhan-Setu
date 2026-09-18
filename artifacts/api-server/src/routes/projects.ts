import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, projects } from "@workspace/db";

const router: IRouter = Router();

router.get("/projects", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/projects failed", error);
    return res.status(500).json({
      message: "Unable to load projects",
    });
  }
});

export default router;
