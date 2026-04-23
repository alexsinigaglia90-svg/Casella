// Module augmentation for next-auth Session and JWT.
// This file is imported for its side-effects (types only) by config.ts.
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    entraOid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    entraOid?: string;
  }
}

export {};
