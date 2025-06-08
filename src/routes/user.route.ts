import { Router } from "express";
import { googleAuthController, loginUser, registerUser, resetForgotPassword, sendForgotPasswordOtp, sendOtpEmail, verifyForgotOtp, verifyOtpEmail } from "../controllers/user.controller";
const router = Router();

router.post("/registerUser", registerUser);
router.post('/send-otp', sendOtpEmail);
router.post('/verify-otp', verifyOtpEmail);
router.post('/signin-signup-google', googleAuthController);
router.post('/login', loginUser);
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotOtp);
router.post('/forgot-password/reset-password', resetForgotPassword);




export default router;