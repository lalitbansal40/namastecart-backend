import { Router } from "express";
import { addToCart, getCartItems, removeFromCart } from "../controllers/cart.controller";
import { authenticate } from "../middlerware/authenticate.middleware";
const router = Router();

router.get("/cart-items", authenticate, getCartItems);
router.post("/add-to-cart", authenticate, addToCart);
router.delete("/remove-to-cart", authenticate, removeFromCart);


export default router;