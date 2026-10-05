import { Router, type IRouter } from "express";
import healthRouter from "./health";
import websiteBookingsRouter from "./website-bookings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(websiteBookingsRouter);

export default router;
