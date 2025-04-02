import prisma from "@/config/db/prisma";
import { NotificationType } from "@prisma/client";

export async function createNotificationModel(
    email: string, notifyType: NotificationType
) {
    const normalizedIdentifier = email.toLowerCase();
    const user = await prisma.user.findFirst({
        where: { email: normalizedIdentifier }
    });

    if (!user) {
        return { status: 404, error: "cannot find user" }
    }
    const notification = await prisma.notifier.create({
        data: {
            userId: user.id,
            email: normalizedIdentifier,
            notifyType,
            notify: new Date(),
        }
    });

    if (notification) {
        return { status: 200, message: "Notification Created" }
    }
}


export async function deleteNotificationModels(userId?: string, notifyType?: NotificationType, id?: string) {
    if (id) {
        const result = await prisma.notifier.delete({
            where: { id },
        });

        if (result) {
            return { status: 200, message: "Notification Deleted using id" }
        } else {
            return { status: 500, message: "Notification cannot be Deleted using id" }
        }
    }
    const result = await prisma.notifier.deleteMany({
        where: { userId, notifyType },
    });

    if (result) {
        return { status: 200, message: "Notification Deleted using email" }
    } else {
        return { status: 500, error: "Notification cannot be Deleted using email" }
    }
}