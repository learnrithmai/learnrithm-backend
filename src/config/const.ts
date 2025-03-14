import log from "../utils/chalkLogger";
import { ENV } from "../validations/envSchema";

export const isProd = ENV.NODE_ENV === "production";
export const isDev = ENV.NODE_ENV === "development";

log.debug("the mode is in const.js", ENV.NODE_ENV as string);

// for mongoose connection status
export const readyStates = new Map<number, string>([
  [0, "disconnected"],
  [1, "connected"],
  [2, "connecting"],
  [3, "disconnecting"],
  [4, "uninitialized"],
]);

// for user roles
type RoleRights = {
  [role: string]: string[];
};

const allRoles: RoleRights = {
  user: [],
  admin: ["getUsers", "manageUsers"],
};

export const roles: string[] = Object.keys(allRoles);
export const roleRights: Map<string, string[]> = new Map(
  Object.entries(allRoles),
);

// for token types
type TokenTypes = {
  ACCESS: string;
  REFRESH: string;
  RESET_PASSWORD: string;
  VERIFY_EMAIL: string;
};

// for token types
export const tokenTypes: TokenTypes = {
  ACCESS: "access",
  REFRESH: "refresh",
  RESET_PASSWORD: "password_reset",
  VERIFY_EMAIL: "email_validation",
};
