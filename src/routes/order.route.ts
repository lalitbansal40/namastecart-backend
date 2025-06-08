import { Router } from "express";
import { authenticate } from "../middlerware/authenticate.middleware";
import { cancelOrder, createOrder, getOrders, verifyPayment } from "../controllers/order.controller";
const router = Router();

router.get("/my-orders", authenticate, getOrders);
router.post("/create-order", authenticate, createOrder);
router.post("/verify-payment", authenticate, verifyPayment);
router.post("/cancel-order/:orderId", authenticate, cancelOrder);



export default router;