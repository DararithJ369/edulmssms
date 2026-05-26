import { cookies } from "next/headers";
import Image from "next/image";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "guest";
};

const Navbar = () => {
  const role = normalizeRole(cookies().get("user_role")?.value);
  return (
    <div className="flex items-center justify-between p-4 transition-colors duration-300">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-border bg-background px-2">
        <Image src="/search.png" alt="" width={14} height={14} className="opacity-70" />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        <div className="bg-card rounded-full w-7 h-7 flex items-center justify-center cursor-pointer border border-border">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <div className="bg-card rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative border border-border">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-xs">
            1
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium text-foreground">John Doe</span>
          <span className="text-[10px] text-muted-foreground text-right">{role}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          JD
        </div>
      </div>
    </div>
  );
};

export default Navbar;
