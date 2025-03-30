import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
  VerifiedCallback,
} from "passport-jwt";
import { ENV } from "../../validations/envSchema";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/db/prisma";
import { TokenType } from "@prisma/client";

/**
 * JWT options for passport strategy.
 *
 * @type {StrategyOptions}
 *
 * @example
 * const jwtOptions = {
 *   secretOrKey: ENV.JWT_SECRET,
 *   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
 * };
 *
 * passport.use(new JwtStrategy(jwtOptions, jwtVerify));
 */
const jwtOptions: StrategyOptions = {
  secretOrKey: (ENV.JWT_SECRET as string) || "default_secret",
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

/**
 * Verify callback for JWT strategy.
 *
 * @param {JwtPayload} payload - JWT payload.
 * @param {VerifiedCallback} done - Callback function.
 * @returns {Promise<void>}
 *
 * @example
 * passport.use(new JwtStrategy(jwtOptions, jwtVerify));
 */
const jwtVerify = async (
  payload: JwtPayload,
  done: VerifiedCallback,
): Promise<void> => {
  try {
    if (payload.type !== TokenType.access) {
      throw new Error("Invalid token type");
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
    });
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export { jwtStrategy };

/**
 * JWT strategy for passport.
 *
 * @type {JwtStrategy}
 *
 * @example
 * passport.use(jwtStrategy);
 */
