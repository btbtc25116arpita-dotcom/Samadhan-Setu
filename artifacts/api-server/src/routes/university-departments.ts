import { Router, type IRouter } from "express";
import { db, universityDepartment } from "@workspace/db";

const router: IRouter = Router();

router.get("/university-departments", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(universityDepartment);

    return res.json(rows);
  } catch (error) {
    console.error("GET /api/university-departments failed", error);
    return res.status(500).json({
      message: "Unable to load university departments",
    });
  }
});

export default router;
