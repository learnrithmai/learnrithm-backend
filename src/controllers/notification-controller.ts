import { asyncWrapper } from "@/middleware/asyncWrapper";
import logger from "@/utils/chalkLogger";
import {
  createNotificationModel,
  deleteNotificationModels,
} from "@/utils/notificationUtils";
import { createNotificationBody } from "@/validations/notificationSchema";
import { Request, Response } from "express";

export const createNotification = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { email, type } = req.body as createNotificationBody;

    try {
      const result = await createNotificationModel(email, type);

      if (result?.status === 200) {
        logger.success(
          `Notification of type ${type}`,
          `Created Successfully for the user ${email}`
        );
        res.status(200).json({ message: result.message });
        return;
      } else {
        logger.warning(
          `Notification of type ${type}`,
          `Cannot be created because of ${result?.error}`
        );
        res.status(404).json({ error: result?.error });
        return;
      }
    } catch (error) {
      logger.error(
        `Notification of type ${type}`,
        `Cannot be created because of ${error as string}`
      );
      res.status(500).json({ error });
      return;
    }
  }
);

export const deleteNotification = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { email, type, id } = req.body;
    try {
      const result = await deleteNotificationModels(email, type, id);

      if (type) {
        if (result?.status === 200) {
          logger.success(
            `Notification of type ${type}`,
            `deleted Successfully for the user ${email}`
          );
          res.status(200).json({ message: result.message });
          return;
        } else {
          logger.warning(
            `Notification of type ${type}`,
            `Cannot be deleted because of ${result?.error}`
          );
          res.status(404).json({ error: result?.error });
          return;
        }
      } else {
        if (result?.status === 200) {
          logger.success(`Notification of id ${id}`, `deleted Successfully`);
          res.status(200).json({ message: result.message });
          return;
        } else {
          logger.warning(
            `Notification of id ${id}`,
            `Cannot be deleted because of ${result?.error}`
          );
          res.status(404).json({ error: result?.error });
          return;
        }
      }
    } catch (error) {
      if (type) {
        logger.error(
          `Notification of type ${type}`,
          `Cannot be created because of ${error as string}`
        );
        res.status(500).json({ error });
        return;
      } else {
        logger.error(
          `Notification of id ${id}`,
          `Cannot be created because of ${error as string}`
        );
        res.status(500).json({ error });
        return;
      }
    }
  }
);
