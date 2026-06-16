import Image from "next/image";
import { serverFetch } from "@/lib/server-api";

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "parent";
}) => {
  const endpointMap: Record<typeof type, string> = {
    admin: "/users/admins",
    teacher: "/users/instructors",
    student: "/users/students",
    parent: "/users/parents",
  };

  const response = await serverFetch<{ meta?: { total?: number } }>(
    `${endpointMap[type]}?page=1&limit=1`
  );
  const data = response?.meta?.total ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 flex-1 min-w-[130px] transition-colors duration-300">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
          2025/26
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{data}</h1>
      <h2 className="capitalize text-sm font-medium text-muted-foreground">{type}s</h2>
    </div>
  );
};

export default UserCard;
