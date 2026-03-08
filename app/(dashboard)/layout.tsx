// app/(dashboard)/layout.tsx
"use client";

import { Sidebar } from "@/components/layout/Sidebar";
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

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </SessionProvider>
  );
}
