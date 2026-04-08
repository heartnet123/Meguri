import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  plugins: [
    organizationClient()
  ],
});

export const {
  useSession,
  useActiveOrganization,
  signIn,
  signUp,
  signOut,
  organization,
} = authClient;