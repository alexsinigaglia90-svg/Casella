import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { NextAuthConfig } from "next-auth";
import { resolveRoleFromGroups } from "./entra";
import { upsertUserFromEntra } from "./upsert";

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
        const groupsJson = (await groupsRes.json()) as {
          value: { id: string }[];
        };
        const groupIds = groupsJson.value.map((g) => g.id);

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
      async jwt({ token, profile }) {
        if (profile) {
          const p = profile as { oid?: string; sub?: string };
          const oid = p.oid ?? p.sub;
          if (oid) token.entraOid = oid;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.entraOid) {
          (session as { entraOid?: string }).entraOid = token.entraOid as string;
        }
        return session;
      },
    },
    session: { strategy: "jwt" },
    pages: { signIn: "/" },
  };
}
