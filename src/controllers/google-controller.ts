import prisma from "@/config/db/prisma";
import { asyncWrapper } from "@/middleware/asyncWrapper";
import { sendRegisterEmail } from "@/utils/emailUtils";
import { LoginGoogleBody, RegisterUserGoogleBody } from "@/validations/authSchema";
import { Request, Response } from "express";
import geoip from "geoip-lite";

// ────────────────────────────────────────────────────────────────
// Register User Google Provider
// ────────────────────────────────────────────────────────────────



export const registerUserGoogle = asyncWrapper(
    async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                email,
                Name,
                image,
            } = req.body as RegisterUserGoogleBody;

            // Validate required fields.
            if (!email || !Name) {
                res
                    .status(400)
                    .json({ errorMsg: "Email, Name, and method are required" });
                return;
            }

            const normalizedEmail = email.toLowerCase();

            // Check if user exists.
            const existingUser = await prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (existingUser) {
                res.status(409).json({ errorMsg: "User already exists" });
                return;
            }
            let userCountry
            // Determine country from IP if not provided.
            const userIp =
                req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
                req.socket.remoteAddress;
            if (userIp) {
                const geo = geoip.lookup(userIp);
                userCountry = geo?.country || "Unknown";
            }

            // Use a transaction for atomic operations.
            const createdUser = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    imgThumbnail: image,
                    method: 'google',
                    Name,
                    country: userCountry as string,
                    lastLogin: new Date(),
                    plan: "free",
                },
            });

            await sendRegisterEmail({ Name, email });

            // Build the client user object.
            const clientUser = {
                id: createdUser.id,
                Name: createdUser.Name,
                email: createdUser.email,
                method: createdUser.method,
                lastLogin: createdUser?.lastLogin
                    ? new Date(createdUser.lastLogin).toISOString()
                    : null,
                imgThumbnail: createdUser.imgThumbnail,
            };

            res.status(201).json({
                success: `User ${createdUser.email} created successfully!`,
                user: clientUser,
            });
        } catch (error) {
            console.error("Error in registerUser:", error);
            res.status(500).json({
                errorMsg: "User creation failed",
                details: error instanceof Error ? error.message : error,
            });
        }
    }
);

// ────────────────────────────────────────────────────────────────
// LOGIN User Google Provider
// ────────────────────────────────────────────────────────────────

export const loginGoogle = asyncWrapper(
    async (req: Request, res: Response): Promise<void> => {
        const { email, image } = req.body as LoginGoogleBody;
        const normalizedIdentifier = email.toLowerCase();

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: normalizedIdentifier, method: "normal" },
            select: {
                id: true,
                method: true,
                password: true,
                Name: true,
                email: true,
                lastLogin: true,
                imgThumbnail: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: "User with that email not found" });
            return;
        }

        if (image) {
            await prisma.user.update({
                where: { email: normalizedIdentifier, method: "normal" },
                data: {
                    imgThumbnail: image
                }
            })
        };

        res.send({
            success: `Login successful: ${user.Name}!`,
            user,
        });
    }
);
