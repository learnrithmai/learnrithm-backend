import chalk from "chalk";

type LogFunction = (title: string, msg?: string) => void;

interface Logger {
  error: LogFunction;
  warning: LogFunction;
  success: LogFunction;
  info: LogFunction;
  debug: LogFunction;
  database: LogFunction;
  server: LogFunction;
  auth: LogFunction;
}

/**
 * Logger object for console logging with different levels and colors.
 * @type {Logger}
 * @param {string} title - The title of the message.
 * @param {string} [msg] - The message to log.
 * @example
 * logger.error('Error Title', 'Error Message');
 * logger.warning('Warning Title', 'Warning Message');
 * logger.success('Success Title', 'Success Message');
 * ...
 */

const logger: Logger = {
  error: (title, msg) =>
    console.log(
      (msg ? chalk.bgRedBright(title) + " " : "") +
        chalk.bold.underline.red(msg || title),
    ),
  warning: (title, msg) =>
    console.log(
      (msg ? chalk.bgYellowBright(title) + " " : "") +
        chalk.keyword("orange")(msg || title),
    ),
  success: (title, msg) =>
    console.log(
      (msg ? chalk.green(title) + " " : "") + chalk.green(msg || title),
    ),
  info: (title, msg) =>
    console.log(
      (msg ? chalk.green(title) + " " : "") +
        chalk.blueBright.underline(msg || title),
    ),
  debug: (title, msg) =>
    console.log(
      (msg ? chalk.bgGreenBright(title) + " " : "") +
        chalk.bgCyan(msg || title),
    ),
  database: (title, msg) =>
    console.log(
      (msg ? chalk.cyan(title) + " " : "") + chalk.magenta(msg || title),
    ),
  server: (title, msg) =>
    console.log(
      (msg ? chalk.green(title) + " " : "") + chalk.cyan(msg || title),
    ),
  auth: (title, msg) =>
    console.log(
      (msg ? chalk.green(title) + " " : "") + chalk.yellow(msg || title),
    ),
};

export default logger;
