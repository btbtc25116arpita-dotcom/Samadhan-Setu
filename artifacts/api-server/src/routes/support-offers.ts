import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
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
router.post("/support-offers", async (req, res) => {
  try {
    const body = req.body as {
      projectId?: string;
      supportType?: string;
      description?: string;
      fundingAmount?: string | number;
    };

    const projectId =
      typeof body.projectId === "string"
        ? body.projectId.trim()
        : "";

    const supportType =
      typeof body.supportType === "string"
        ? body.supportType.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!projectId || !supportType) {
      return res.status(400).json({
        message: "projectId and supportType are required",
      });
    }

    let fundingAmount: string | null = null;

    if (
      body.fundingAmount !== undefined &&
      body.fundingAmount !== null &&
      String(body.fundingAmount).trim()
    ) {
      const cleanedAmount = String(body.fundingAmount)
        .replace(/[₹,\s]/g, "")
        .trim();

      if (cleanedAmount) {
        fundingAmount = cleanedAmount;
      }
    }

    const [created] = await db
      .insert(supportOffers)
      .values({
        id: randomUUID(),
        projectId,
        supportType,
        description: description || null,
        fundingAmount,
        status: "Pending",
      })
      .returning();

    return res.status(201).json(created);
  } catch (error) {
    console.error("POST /api/support-offers failed", error);

    return res.status(500).json({
      message: "Unable to create support offer",
    });
  }
});

export default router;
