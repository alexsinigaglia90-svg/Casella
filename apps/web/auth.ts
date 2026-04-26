import { buildAuthConfig } from "@casella/auth";
import NextAuth, { type NextAuthResult } from "next-auth";

const result: NextAuthResult = NextAuth(buildAuthConfig());

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
export const auth: NextAuthResult["auth"] = result.auth;
