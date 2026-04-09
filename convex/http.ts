import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './betterAuth/auth';

const http = httpRouter();

// Mount all Better Auth routes (sign-in, sign-out, session, etc.)
authComponent.registerRoutes(http, createAuth);

export default http;
