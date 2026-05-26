import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = cookies().get("user_role")?.value ?? "";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FA]">
      <Sidebar role={role} />
      <div
        className="min-h-screen transition-[padding] duration-300 pr-3 sm:pr-4"
        style={{ paddingLeft: "var(--sidebar-width, 280px)" }}
      >
        <Navbar />
        {children}
      </div>
    </div>
  );
}
