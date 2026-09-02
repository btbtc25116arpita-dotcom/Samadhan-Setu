import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, problems } from "@workspace/db";

const router: IRouter = Router();

type ProblemInput = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  district?: string;
  location?: string;
  urgency?: string;
  people?: string;
  evidence?: string;
  status?: string;
  votes?: number;
  reportedBy?: string;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

router.get("/problems", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(problems)
      .orderBy(desc(problems.createdAt));

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/problems failed", error);
    return res.status(500).json({ message: "Unable to load problems" });
  }
});

router.post("/problems", async (req, res) => {
  try {
    const body = req.body as ProblemInput;

    const title = clean(body.title);
    const description = clean(body.description);
    const category = clean(body.category);
    const district = clean(body.district);
    const location = clean(body.location);
    const urgency = clean(body.urgency);
    const people = clean(body.people);
    const evidence = clean(body.evidence);

    if (
      !title ||
      !description ||
      !category ||
      !district ||
      !location ||
      !urgency ||
      !people
    ) {
      return res
        .status(400)
        .json({ message: "Required problem details are missing" });
    }

    const id =
      clean(body.id) ||
      `SS-JH-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;

    const [created] = await db
      .insert(problems)
      .values({
        id,
        title,
        description,
        category,
        district,
        location,
        urgency,
        people,
        evidence,
        status: clean(body.status) || "Under review",
        votes: Number.isFinite(body.votes) ? Number(body.votes) : 0,
        reportedBy: clean(body.reportedBy),
      })
      .returning();

    return res.status(201).json(created);
  } catch (error) {
    console.error("POST /api/problems failed", error);
    return res.status(500).json({ message: "Unable to save problem" });
  }
});

router.patch("/problems/:id/status", async (req, res) => {
  try {
    const id = clean(req.params.id);
    const status = clean((req.body as { status?: string }).status);

    if (!id || !status) {
      return res
        .status(400)
        .json({ message: "Problem id and status are required" });
    }

    const [updated] = await db
      .update(problems)
      .set({ status })
      .where(eq(problems.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Problem not found" });
    }

    return res.json(updated);
  } catch (error) {
    console.error("PATCH /api/problems/:id/status failed", error);
    return res
      .status(500)
      .json({ message: "Unable to update problem status" });
  }
});

export default router;
