import { loginGoogle, registerUserGoogle } from "@/controllers/google-controller";
import { loginSchema, RegisterUserGoogleSchema } from "@/validations/authSchema";
import { Router } from "express";
import validate from "express-zod-safe";

const router = Router({ mergeParams: true });

// Register a new user Google Provider
router.post("/register", validate(RegisterUserGoogleSchema), registerUserGoogle);


// User login Google Provider
router.post("/login", validate(loginSchema), loginGoogle);

export default router;