import { Router } from "express";
import validate from "express-zod-safe";
import { getUser, updateUser } from "@controllers/user-controller";
import auth from "@/middleware/auth/passportJWTAuth";
import { getUserSchema, updateUserSchema } from "@/validations/userSchema";

const router = Router({ mergeParams: true });

// Get single user
router.get("/:id", auth(), validate(getUserSchema), getUser);

// Update user info or password
router.patch("/:updateType", auth(), validate(updateUserSchema), updateUser);

export default router;

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management and retrieval
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
 *         Name:
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
 *         - Name
 *         - country
 *
 *     UpdateUserInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
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
 *       required:
 *         - id
 *         - password
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *
 *   responses:
 *     Unauthorized:
 *       description: Unauthorized access. A valid JWT token is required.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     NotFound:
 *       description: Resource not found.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     DuplicateEmail:
 *       description: A user with the provided email already exists.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Forbidden:
 *       description: You do not have permission to perform this action.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *
 * /users:
 *   post:
 *     summary: Create a user
 *     description: Only admins can create other users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *               role: user
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all users
 *     description: Only admins can retrieve all users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: User name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: User role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of users
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve user information. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 * /users/{updateType}:
 *   patch:
 *     summary: Update user information or password
 *     description: Update user details or password. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: updateType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [UpdateInfo, UpdatePassword]
 *         description: Type of update to perform
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/UpdateUserInfo'
 *               - $ref: '#/components/schemas/UpdateUserPassword'
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a user
 *     description: Logged in users can delete only themselves. Only admins can delete other users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       "200":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */