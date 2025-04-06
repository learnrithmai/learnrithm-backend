import { Router } from "express";
import validate from "express-zod-safe";
import {
  getUser,
  getUserPlanCountry,
  updateUserInfo,
  UpdateUserPassword,
  updateUserPlan,
} from "@controllers/user-controller";
// import auth from "@/middleware/auth/passportJWTAuth";
import {
  getUserSchema,
  updateInfoSchema,
  updatePasswordSchema,
  updatePlanSchema,
} from "@/validations/userSchema";

const router = Router({ mergeParams: true });

// Get single user
router.get("/:email", validate(getUserSchema), getUser);

// Get user country and plan for real time processing
router.get("/get-country-plan/:email", validate(getUserSchema), getUserPlanCountry);

// Update user password
router.post(
  "/update-password",
  validate(updatePasswordSchema),
  UpdateUserPassword,
);

// Update user plan
router.post("/update-plan", validate(updatePlanSchema), updateUserPlan);

// Update user infos
router.post("/update-info", validate(updateInfoSchema), updateUserInfo);

export default router;

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Endpoints for user management.
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         isVerified:
 *           type: boolean
 *         name:
 *           type: string
 *         birthDate:
 *           type: string
 *           format: date-time
 *         country:
 *           type: string
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         institution:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         linkedin:
 *           type: string
 *         instagram:
 *           type: string
 *         facebook:
 *           type: string
 *         x:
 *           type: string
 *         imgThumbnail:
 *           type: string
 *         plan:
 *           type: string
 *           enum:
 *             - trial_monthly
 *             - trial_yearly
 *             - charged_monthly
 *             - charged_yearly
 *         ExpirationSubscription:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - email
 *         - name
 *         - country
 *
 *     UpdateUserInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         imgThumbnail:
 *           type: string
 *         birthDate:
 *           type: string
 *           format: date-time
 *         phoneNumber:
 *           type: string
 *         institution:
 *           type: string
 *         linkedin:
 *           type: string
 *         instagram:
 *           type: string
 *         facebook:
 *           type: string
 *         x:
 *           type: string
 *       required:
 *         - id
 *
 *     UpdateUserPassword:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         password:
 *           type: string
 *           minLength: 8
 *         newPassword:
 *           type: string
 *           minLength: 8
 *       required:
 *         - id
 *         - password
 *         - newPassword
 *
 *     UpdateUserPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         plan:
 *           type: string
 *           enum:
 *             - trial_monthly
 *             - trial_yearly
 *             - charged_monthly
 *             - charged_yearly
 *         ExpirationSubscription:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - plan
 *         - ExpirationSubscription
 *
 *     Error:
 *       type: object
 *       properties:
 *         errorMsg:
 *           type: string
 *
 * /users/{email}:
 *   get:
 *     summary: Get a user by email
 *     description: Retrieve user information using the user's email.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: The email of the user to fetch.
 *     responses:
 *       "200":
 *         description: User retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "404":
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /users/update-password:
 *   post:
 *     summary: Update user password
 *     description: Update the password of an existing user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserPassword'
 *     responses:
 *       "200":
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *       "400":
 *         description: Bad Request - invalid input or password incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "404":
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /users/update-plan:
 *   post:
 *     summary: Update user plan
 *     description: Update the subscription plan and expiration of an existing user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserPlan'
 *     responses:
 *       "200":
 *         description: User plan updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "400":
 *         description: Bad Request - missing or invalid fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "404":
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /users/update-info:
 *   post:
 *     summary: Update user information
 *     description: Update the details of an existing user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInfo'
 *     responses:
 *       "200":
 *         description: User information updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "400":
 *         description: Bad Request - missing or invalid data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "404":
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
