import winston from "winston";
import { isDev } from "../../config/const";

/**
 * Custom format to enumerate error stack in the message.
 * @param {winston.Logform.TransformableInfo} info - The log information.
 * @returns {winston.Logform.TransformableInfo} The transformed log information.
 */
const enumerateErrorFormat = winston.format(
  (info: winston.Logform.TransformableInfo) => {
    if (info instanceof Error) {
      Object.assign(info, { message: info.stack });
    }
    return info;
  },
);

/**
 * Creates a Winston logger instance.
 * @returns {winston.Logger} The configured Winston logger.
 * @example
 * import logger from './winstonConfig';
 * logger.info('Connected to MongoDB');
 * logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
 * logger.error(new Error('This is an error message'));
 */
const logger: winston.Logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: winston.format.combine(
    enumerateErrorFormat(),
    isDev ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
