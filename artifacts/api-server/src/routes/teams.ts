import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/teams", async (_req, res) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error("GET /api/teams failed", error);
    return res.status(500).json({
      message: "Unable to load teams",
    });
  }
});

export default router;
