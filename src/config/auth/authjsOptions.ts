import Google from "@auth/express/providers/google";
import { type AuthConfig } from "@auth/core";

export const authConfig: AuthConfig = {
  trustHost: true,
  providers: [Google],
};
