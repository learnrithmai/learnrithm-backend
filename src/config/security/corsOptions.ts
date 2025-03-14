import { isProd } from "../../config/const";
import { ENV } from "../../validations/envSchema";
import { CorsOptions } from "cors"; // Assuming you are using the 'cors' package

/**
 * CORS configuration options.
 * @type {CorsOptions}
 * @property {function} origin - Function to determine if the origin is allowed.
 * @property {boolean} credentials - Indicates whether or not the response to the request can be exposed when the credentials flag is true.
 * @property {number} optionsSuccessStatus - Provides a status code to use for successful OPTIONS requests.
 * @example
 * import cors from 'cors';
 * import { corsOptions } from './corsOptions';
 *
 * const app = express();
 * app.use(cors(corsOptions));
 */
export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    //? Allow requests with no origin (non-browser clients )
    //? (like mobile apps or curl requests / Thunder Client , Postman etc)
    if (!origin && !isProd) return callback(null, true);

    //? Allow requests from the same origin
    if ((ENV.ALLOWED_ORIGINS).includes(origin as string)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // this allows the session cookie to be sent back and forth
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
