import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/projects", async (_req, res) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error("GET /api/projects failed", error);
    return res.status(500).json({
      message: "Unable to load projects",
    });
  }
});

export default router;
