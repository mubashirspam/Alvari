"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Singleton — used in client components for useSession() hook and sign-in/out actions.
// The Next.js adapter auto-routes to /api/auth on the same origin.
export const userAuthClient = createAuthClient();
