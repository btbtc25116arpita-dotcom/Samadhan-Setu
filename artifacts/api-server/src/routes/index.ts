import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import problemsRouter from "./problems.js";
import usersRouter from "./users.js";
import aiRouter from "./ai.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(problemsRouter);
router.use(aiRouter);
router.use("/users", usersRouter);

export default router;
