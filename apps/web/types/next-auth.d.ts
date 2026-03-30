import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    username: string;
    isSuperAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      isSuperAdmin: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    isSuperAdmin?: boolean;
    name?: string | null;
    sessionId?: string;
  }
}
