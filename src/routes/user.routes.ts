import { Router } from "express";
import {
  signup,
  verifyEmail,
  resendVerificationEmail,
  signin,
  updateProfile,
  updateUserPlan,
  forgotPassword,
  resetPassword,
} from "../controllers/user-controller";

const router = Router();

router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/resendVerificationEmail", resendVerificationEmail);
router.post("/signin", signin);
router.post("/profile", updateProfile);
router.post("/updateUserPlan", updateUserPlan);
router.post("/forgot", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
