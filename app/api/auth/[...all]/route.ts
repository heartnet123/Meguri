import { toNextJsHandler } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { convex } from "@convex-dev/better-auth/plugins";
import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";

// Normally you would extract `createAuth` from your convex folder,
// but since the convex server setup uses GenericCtx and we are in Next.js edge/node environment here,
// we setup the auth instance explicitly for the Next.js API route to match what we configured in Convex.

const authConfig = {
  providers: [getAuthConfigProvider()],
};

const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization(),
    convex({
      authConfig,
    }),
  ],
});

export const { GET, POST } = toNextJsHandler(auth);
