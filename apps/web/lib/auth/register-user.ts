export type RegisterUserInput = {
  username: string;
  passwordHash: string;
  displayName: string;
};

export type RegisterUserInsertValues = RegisterUserInput & {
  isSuperAdmin: boolean;
};

export type RegisterUserDeps<TUser> = {
  usernameExists: (username: string) => Promise<boolean>;
  superAdminExists: () => Promise<boolean>;
  insertUser: (values: RegisterUserInsertValues) => Promise<TUser>;
};

export type RegisterUserResult<TUser> =
  | {
      ok: true;
      user: TUser;
    }
  | {
      ok: false;
      reason: "username_exists";
    };

export async function registerUser<TUser>(
  input: RegisterUserInput,
  deps: RegisterUserDeps<TUser>,
): Promise<RegisterUserResult<TUser>> {
  if (await deps.usernameExists(input.username)) {
    return {
      ok: false,
      reason: "username_exists",
    };
  }

  const insertAttempts = (await deps.superAdminExists()) ? [false] : [true, false];

  for (const isSuperAdmin of insertAttempts) {
    try {
      return {
        ok: true,
        user: await deps.insertUser({
          ...input,
          isSuperAdmin,
        }),
      };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      if (await deps.usernameExists(input.username)) {
        return {
          ok: false,
          reason: "username_exists",
        };
      }

      if (isSuperAdmin) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to register user");
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "23505",
  );
}
