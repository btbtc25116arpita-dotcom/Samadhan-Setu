import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, projects } from "@workspace/db";

const router: IRouter = Router();

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

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

router.post("/projects", async (req, res) => {
  try {
    const body = req.body as {
      problemId?: string;
      projectName?: string;
      description?: string;
    };

    const problemId = clean(body.problemId);
    const projectName = clean(body.projectName);

    if (!problemId || !projectName) {
      return res.status(400).json({
        message: "problemId and projectName are required",
      });
    }

    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.problemId, problemId))
      .limit(1);

    if (existing.length > 0) {
      return res.status(200).json(existing[0]);
    }

    const [created] = await db
      .insert(projects)
      .values({
        id: randomUUID(),
        problemId,
        projectName,
        description: clean(body.description) || null,
        status: "Proposed",
        progress: 0,
      })
      .returning();

    return res.status(201).json(created);
  } catch (error) {
    console.error("POST /api/projects failed", error);

    return res.status(500).json({
      message: "Unable to create project",
    });
  }
});

export default router;
