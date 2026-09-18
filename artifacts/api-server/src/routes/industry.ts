import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/industry-partners", async (_req, res) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error("GET /api/industry-partners failed", error);
    return res.status(500).json({
      message: "Unable to load industry partners",
    });
  }
});

export default router;
