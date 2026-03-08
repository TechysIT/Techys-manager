import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Get user permissions from token
    const permissions = (token.permissions as any[]) || [];

    // Helper function to check permission
    const hasPermission = (resource: string, action: string) => {
      return permissions.some(
        (p) => p.resource === resource && p.action === action,
      );
    };

    // Check permissions based on route
    if (path.startsWith("/projects")) {
      if (!hasPermission("project", "read")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (path.startsWith("/sections")) {
      if (!hasPermission("section", "read")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (path.startsWith("/tasks")) {
      if (!hasPermission("task", "read")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (path.startsWith("/reports")) {
      if (!hasPermission("report", "read")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/sections/:path*",
    "/tasks/:path*",
    "/reports/:path*",
  ],
};
