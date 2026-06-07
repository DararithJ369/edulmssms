"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { CommandPaletteProvider, useCommandPalette } from "@/hooks/useCommandPalette";
import { normalizeRole } from "@/lib/auth";
import { useMemo } from "react";

function ShellInner({ role, children }: { role: string; children: React.ReactNode }) {
  const { isOpen, open, close } = useCommandPalette();
  const normalizedRole = useMemo(() => normalizeRole(role), [role]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FA]">
      {/* Fixed sidebar */}
      <Sidebar role={role} onOpenCommandPalette={open} />

      {/* Main content area — shifts right by sidebar width */}
      <div
        className="min-h-screen transition-[padding-left] duration-300 pr-3 sm:pr-4"
        style={{ paddingLeft: "var(--sidebar-width, 268px)" }}
      >
        {/* Sticky utility navbar */}
        <Navbar onOpenCommandPalette={open} />

        {/* Page content */}
        {children}
      </div>

      {/* Global command palette overlay */}
      <CommandPalette isOpen={isOpen} onClose={close} role={normalizedRole} />
    </div>
  );
}

export default function DashboardShell({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <ShellInner role={role}>{children}</ShellInner>
    </CommandPaletteProvider>
  );
}
