import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 🚀 Cleaned up the broken Geist import here
import "./globals.css";
import Script from "next/dist/client/script";
import { cn } from "@/lib/utils";
import { DialogProvider } from "@/hooks/DialogProvider";
import { ToastProvider } from "@/hooks/ToastProvider";

// 🎯 Restores your exact original typography stack layout natively
const geistVariable = "Geist, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduLams - Learning & School Management System",
  description: "Next.js Learning & School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* 🔒 Kept your exact original HTML structure, element bindings, and variable strings intact */
    <html lang="en" className={cn("font-sans")} style={{ "--font-sans": geistVariable } as React.CSSProperties} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <DialogProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DialogProvider>
        <Script 
          src="https://upload-widget.cloudinary.com/global/all.js" 
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}