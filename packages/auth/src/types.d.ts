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
