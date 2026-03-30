import { eq } from "drizzle-orm";

import { hashPassword } from "@anchordesk/auth";
import { getDb, users } from "@anchordesk/db";

import { readRegistrationEnabled } from "@/lib/auth/registration";
import { registerUser } from "@/lib/auth/register-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await readRegistrationEnabled())) {
    return Response.json({ error: "Registration is disabled" }, { status: 403 });
  }

  const body = (await request.json()) as {
    username?: string;
    password?: string;
    displayName?: string;
  };

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim();

  if (username.length < 3 || password.length < 6) {
    return Response.json(
      { error: "Username must be at least 3 chars and password at least 6 chars." },
      { status: 400 },
    );
  }

  const db = getDb();
  const passwordHash = await hashPassword(password);
  const result = await registerUser(
    {
      username,
      passwordHash,
      displayName: displayName || username,
    },
    {
      usernameExists: async (candidateUsername) => {
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, candidateUsername))
          .limit(1);

        return Boolean(existing[0]);
      },
      superAdminExists: async () => {
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.isSuperAdmin, true))
          .limit(1);

        return Boolean(existing[0]);
      },
      insertUser: async (values) => {
        const [user] = await db
          .insert(users)
          .values(values)
          .returning({
            id: users.id,
            username: users.username,
            isSuperAdmin: users.isSuperAdmin,
          });

        return user;
      },
    },
  );

  if (!result.ok) {
    return Response.json({ error: "Username already exists." }, { status: 409 });
  }

  return Response.json({ user: result.user }, { status: 201 });
}
