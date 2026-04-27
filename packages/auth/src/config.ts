import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { NextAuthConfig } from "next-auth";
import { getDb, schema } from "@casella/db";
import { eq } from "drizzle-orm";
import { resolveRoleFromGroups } from "./entra";
import { upsertUserFromEntra } from "./upsert";
import "./types"; // session/JWT module augmentation (real .ts file so webpack can resolve it)

/**
 * Reads the user's stored themePreference from DB.
 * Best-effort: returns undefined on error so login is never blocked.
 */
async function readThemeFromDb(
  entraOid: string
): Promise<string | undefined> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ themePreference: schema.users.themePreference })
      .from(schema.users)
      .where(eq(schema.users.entraOid, entraOid))
      .limit(1);
    return row?.themePreference ?? undefined;
  } catch (e) {
    console.warn("[theme-bootstrap] failed to read theme from DB:", e);
    return undefined;
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function buildAuthConfig(): NextAuthConfig {
  const adminGroupId = required("ENTRA_ADMIN_GROUP_ID");
  const employeeGroupId = required("ENTRA_EMPLOYEE_GROUP_ID");

  return {
    providers: [
      MicrosoftEntraID({
        clientId: required("AUTH_MICROSOFT_ENTRA_ID_ID"),
        clientSecret: required("AUTH_MICROSOFT_ENTRA_ID_SECRET"),
        issuer: `https://login.microsoftonline.com/${required(
          "AUTH_MICROSOFT_ENTRA_ID_ISSUER"
        )}/v2.0`,
        authorization: {
          params: {
            scope: "openid profile email User.Read GroupMember.Read.All",
          },
        },
      }),
    ],
    callbacks: {
      async signIn({ account, profile }) {
        if (!account?.access_token || !profile) return false;

        const groupsRes = await fetch(
          "https://graph.microsoft.com/v1.0/me/memberOf?$select=id",
          {
            headers: { Authorization: `Bearer ${account.access_token}` },
          }
        );
        if (!groupsRes.ok) return false;
        const groupsJson: unknown = await groupsRes.json();
        const groupIds: string[] = Array.isArray(
          (groupsJson as { value?: unknown })?.value
        )
          ? (groupsJson as { value: { id: string }[] }).value
              .map((g) => g.id)
              .filter((id): id is string => typeof id === "string")
          : [];

        const role = resolveRoleFromGroups(groupIds, {
          adminGroupId,
          employeeGroupId,
        });
        if (!role) return false;

        const entraProfile = profile as {
          oid?: string;
          sub?: string;
          email?: string;
          preferred_username?: string;
          name?: string;
        };
        const oid = entraProfile.oid ?? entraProfile.sub;
        const email = entraProfile.email ?? entraProfile.preferred_username;
        const displayName = entraProfile.name ?? email ?? "Onbekend";

        if (!oid || !email) return false;

        await upsertUserFromEntra({ oid, email, displayName, role });
        return true;
      },
      async jwt({ token, profile, trigger }) {
        if (profile) {
          const p = profile as { oid?: string; sub?: string };
          const oid = p.oid ?? p.sub;
          if (oid) token.entraOid = oid;
        }
        // On sign-in, read the user's stored theme from DB and embed it in the
        // JWT token. The web app reads token.themePreference from the session and
        // writes the cookie before the first paint (ML-5). Runs after signIn
        // callback (upsert), so the user row is guaranteed to exist.
        if (trigger === "signIn" && token.entraOid) {
          const theme = await readThemeFromDb(token.entraOid as string);
          if (theme) token.themePreference = theme;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.entraOid) {
          session.entraOid = token.entraOid;
        }
        if (token.themePreference) {
          session.themePreference = token.themePreference as string;
        }
        return session;
      },
    },
    session: { strategy: "jwt" },
    pages: { signIn: "/" },
  };
}
