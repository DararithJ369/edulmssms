"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/ui";
import Link from "next/link";

interface BackButtonProps {
  className?: string;
  href?: string;
}

const BackButton = ({ className, href }: BackButtonProps) => {
  const router = useRouter();

  if (href) {
    return (
      <Link
        href={href}
        title="Go back"
        aria-label="Go back"
        className={cn(
          "p-2 bg-background border border-border hover:bg-accent rounded-xl shadow-sm transition-all duration-200 hover:-translate-x-0.5 shrink-0 flex items-center justify-center",
          className
        )}
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      title="Go back"
      aria-label="Go back"
      className={cn(
        "p-2 bg-background border border-border hover:bg-accent rounded-xl shadow-sm transition-all duration-200 hover:-translate-x-0.5 shrink-0",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
};

export default BackButton;
