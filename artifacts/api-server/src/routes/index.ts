import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import problemsRouter from "./problems.js";
import usersRouter from "./users.js";
import aiRouter from "./ai.js";
import projectsRouter from "./projects.js";
import teamsRouter from "./teams.js";
import industryRouter from "./industry.js";
import supportOffersRouter from "./support-offers.js";
const router: IRouter = Router();

router.use(healthRouter);
router.use(problemsRouter);
router.use(aiRouter);
router.use("/users", usersRouter);
router.use(projectsRouter);
router.use(teamsRouter);
router.use(industryRouter);
router.use(supportOffersRouter);

export default router;
