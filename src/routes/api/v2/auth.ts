import { Router } from "express";
import validate from "express-zod-safe";

import {
  registerUser,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
} from "@controllers/auth-controller";
import {
  registerUserSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@/validations/authSchema";

const router = Router({ mergeParams: true });

// Register a new user
router.post("/register", validate(registerUserSchema), registerUser);

//test
router.get("/test", async (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress;

  // Optional: Use fetch to call a GeoIP API
  const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
  const geoData = await geoRes.json();

  console.log("User country:", geoData.country_name);
  res.send("test");
});

// User login
router.post("/login", validate(loginSchema), login);

// User logout
router.post("/logout", logout);

// Refresh auth tokens
router.post("/refresh-tokens", refreshTokens);

// Forgot password: send reset instructions
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

// Reset password with provided token
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Send a verification email (requires an authenticated user)
router.post("/send-verification-email", sendVerificationEmail);

// Verify email using the token from query parameters
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

export default router;

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints for user registration, login, logout, token refresh, password reset and email verification.
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
 *         - isVerified
 *         - Name
 *         - country
 *
 *     AuthTokens:
 *       type: object
 *       properties:
 *         access:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *             expires:
 *               type: string
 *               format: date-time
 *         refresh:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *             expires:
 *               type: string
 *               format: date-time
 *       required:
 *         - access
 *         - refresh
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *
 *   responses:
 *     Unauthorized:
 *       description: Unauthorized access. A valid JWT is required.
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
 *   examples:
 *     NextLoginExample:
 *       summary: Next.js login example
 *       value: |
 *         // Example usage in a Next.js application:
 *         async function loginUser(email, password) {
 *           const res = await fetch('/api/auth/login', {
 *             method: 'POST',
 *             headers: { 'Content-Type': 'application/json' },
 *             body: JSON.stringify({ email, password }),
 *           });
 *           const data = await res.json();
 *           localStorage.setItem('token', data.tokens.access.token);
 *           return data;
 *         }
 *
 *     NextAuthHeaderExample:
 *       summary: Setting the Authorization header in Next.js
 *       value: |
 *         // Retrieve the token from localStorage and include it in your fetch request:
 *         const token = localStorage.getItem('token');
 *         const res = await fetch('/api/protected-route', {
 *           headers: {
 *             'Authorization': `Bearer ${token}`,
 *             'Content-Type': 'application/json',
 *           },
 *         });
 *
 * /auth/register:
 *   post:
 *     summary: Register as a new user
 *     tags: [Auth]
 *     description: |
 *       Create a new user account. On success, returns the user data and authentication tokens.
 *       Example (Next.js):
 *
 *       ```js
 *       async function registerUser(name, email, password, country) {
 *         const res = await fetch('/api/auth/register', {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *           body: JSON.stringify({
 *             Name: name,
 *             email,
 *             password,
 *             country,
 *             // Optional fields:
 *             birthDate: "2000-01-01T00:00:00.000Z",
 *             institution: "",
 *             phoneNumber: "",
 *             linkedin: "",
 *             instagram: "",
 *             facebook: "",
 *             x: "",
 *             imgThumbnail: ""
 *           }),
 *         });
 *         return await res.json();
 *       }
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - email
 *               - password
 *               - country
 *             properties:
 *               Name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: At least 6 characters
 *               country:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date-time
 *               institution:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               instagram:
 *                 type: string
 *               facebook:
 *                 type: string
 *               x:
 *                 type: string
 *               imgThumbnail:
 *                 type: string
 *             example:
 *               Name: fake name
 *               email: fake@example.com
 *               password: password1
 *               country: US
 *               birthDate: 2000-01-01T00:00:00.000Z
 *     responses:
 *       "201":
 *         description: Created - returns user and tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *
 * /auth/login:
 *   post:
 *     summary: Login and retrieve auth tokens
 *     tags: [Auth]
 *     description: |
 *       Authenticate a user with email and password. On success, returns user data and JWT tokens.
 *       Example (Next.js):
 *
 *       ```js
 *       async function loginUser(email, password) {
 *         const res = await fetch('/api/auth/login', {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *           body: JSON.stringify({ email, password }),
 *         });
 *         const data = await res.json();
 *         localStorage.setItem('token', data.tokens.access.token);
 *         return data;
 *       }
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK - returns user and tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Auth]
 *     description: |
 *       Log out a user by invalidating the refresh token.
 *       Example (Next.js):
 *
 *       ```js
 *       async function logoutUser(refreshToken) {
 *         const res = await fetch('/api/auth/logout', {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *           body: JSON.stringify({ refreshToken }),
 *         });
 *         if (res.status === 204) localStorage.removeItem('token');
 *         return res;
 *       }
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: <your_refresh_token_here>
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh authentication tokens
 *     tags: [Auth]
 *     description: |
 *       Request a new access token using a valid refresh token.
 *       Example (Next.js):
 *
 *       ```js
 *       async function refreshAuthTokens(refreshToken) {
 *         const res = await fetch('/api/auth/refresh-tokens', {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *           body: JSON.stringify({ refreshToken }),
 *         });
 *         return await res.json();
 *       }
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: <your_refresh_token_here>
 *     responses:
 *       "200":
 *         description: OK - returns new auth tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password - send reset instructions
 *     tags: [Auth]
 *     description: |
 *       Sends a reset password email if the provided email exists.
 *       Example (Next.js):
 *
 *       ```js
 *       async function sendResetEmail(email) {
 *         const res = await fetch('/api/auth/forgot-password', {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *           body: JSON.stringify({ email }),
 *         });
 *         return await res.json();
 *       }
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: fake@example.com
 *     responses:
 *       "204":
 *         description: No content - check your email for further instructions
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     description: |
 *       Resets the user's password. The reset token is passed as a query parameter.
 *       Example (Next.js):
 *
 *       ```js
 *       async function resetPassword(newPassword, token) {
 *         const res = await fetch(`/api/auth/reset-password?token=${token}`, {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *           body: JSON.stringify({ password: newPassword }),
 *         });
 *         return res.status;
 *       }
 *       ```
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: At least 6 characters
 *             example:
 *               password: password1
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Password reset failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /auth/send-verification-email:
 *   post:
 *     summary: Send verification email
 *     tags: [Auth]
 *     description: |
 *       Sends an email to verify the user's email address. Requires an authenticated user.
 *       Example (Next.js):
 *
 *       ```js
 *       async function sendVerificationEmail() {
 *         const token = localStorage.getItem('token');
 *         const res = await fetch('/api/auth/send-verification-email', {
 *           method: 'POST',
 *           headers: {
 *             'Content-Type': 'application/json',
 *             'Authorization': `Bearer ${token}`,
 *           },
 *         });
 *         return res.status;
 *       }
 *       ```
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Auth]
 *     description: |
 *       Verifies the user's email using a token provided as a query parameter.
 *       Example (Next.js):
 *
 *       ```js
 *       async function verifyEmail(token) {
 *         const res = await fetch(`/api/auth/verify-email?token=${token}`, {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *         });
 *         return res.status;
 *       }
 *       ```
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Email verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
