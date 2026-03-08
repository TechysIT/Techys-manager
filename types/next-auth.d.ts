import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    roleId: string;
    permissions: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
    }>;
  }

  interface Session {
    user: {
      [x: string]: ReactNode;
      id: string;
      email: string;
      name: string;
      role: string;
      roleId: string;
      permissions: Array<{
        id: string;
        name: string;
        resource: string;
        action: string;
      }>;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    roleId: string;
    permissions: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
    }>;
  }
}
