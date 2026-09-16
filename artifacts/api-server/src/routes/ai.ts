import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/ai/analyze-problem", async (req, res) => {
  try {
    const { title, description, district, category, urgency, people } =
      req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    return res.json({
      message: "AI analysis endpoint is ready",
      problem: {
        title,
        description,
        district,
        category,
        urgency,
        people,
      },
    });
  } catch (error) {
    console.error("POST /api/ai/analyze-problem failed", error);
    return res.status(500).json({
      message: "Unable to analyze problem",
    });
  }
});

export default router;
