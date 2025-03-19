import { isProd } from "../../config/const";
import { HelmetOptions } from "helmet";

/**
 * Helmet configuration options.
 * @type {HelmetOptions}
 * @example
 * import { helmetOptions } from './helmetOptions';
 * import helmet from 'helmet';
 *
 * const app = express();
 * app.use(helmet(helmetOptions));
 */
export const helmetOptions: HelmetOptions = {
  //Blocks others from loading your resources cross-origin
  crossOriginResourcePolicy: {
    policy: isProd ? "same-origin" : "cross-origin", // fix loading image for diff origin in dev mode
  },
};
