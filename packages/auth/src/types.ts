// Module augmentation for next-auth Session and JWT.
// This file is imported for its side-effects (types only) by config.ts.
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    entraOid?: string;
    /** Stored DB theme preference — used by apps/web middleware to bootstrap cookie (ML-5). */
    themePreference?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    entraOid?: string;
    /** Stored DB theme preference — embedded on signIn, read by session callback (ML-5). */
    themePreference?: string;
  }
}

export {};
