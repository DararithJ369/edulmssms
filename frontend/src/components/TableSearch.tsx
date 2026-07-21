"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";

const TableSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`${window.location.pathname}?${params}`);
  };

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    params.delete("page");
    router.push(`${window.location.pathname}?${params}`);
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 h-9 px-3 bg-background border border-border/80 rounded-xl text-sm transition-colors focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/20"
    >
      <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search..."
        aria-label="Search"
        className="w-[160px] md:w-[200px] bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/50"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </form>
  );
};

export default TableSearch;
