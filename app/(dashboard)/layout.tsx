// app/(dashboard)/layout.tsx
"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import NotificationBell from "@/components/ui/NotificationBell";
import { SessionProvider } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar - hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Top bar */}
          <div className="flex justify-end mb-2">
            <NotificationBell />
          </div>

          {/* Page content */}
          <div>{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
}
