"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/ui";

interface BackButtonProps {
  className?: string;
}

const BackButton = ({ className }: BackButtonProps) => {
  const router = useRouter();

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
