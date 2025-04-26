"use client";

import { AppNavbar } from "@/components/app-navbar";

export default function CodeAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      {children}
    </div>
  );
} 