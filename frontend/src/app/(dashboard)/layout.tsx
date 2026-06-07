import { cookies } from "next/headers";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const role = cookies().get("user_role")?.value ?? "";

  return <DashboardShell role={role}>{children}</DashboardShell>;
}
