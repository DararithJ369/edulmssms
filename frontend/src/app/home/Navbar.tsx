"use client";

import { useState, useEffect } from "react";
import { Menu, X, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-md py-3 shadow-lg bg-white/80 dark:bg-[#1c1c1c]/80" : "bg-transparent py-5"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/ams.png" alt="EduLams Logo" className="w-10 h-8" />
            <span className="text-2xl font-bold tracking-tight text-foreground">
              EDU<span className="text-[#0038A8]">LAMS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <a
              href="#home"
              className="text-foreground hover:text-[#0038A8] transition-colors font-medium"
            >
              Overview
            </a>
            <a
              href="#programs"
              className="text-foreground hover:text-[#0038A8] transition-colors font-medium"
            >
              Programs
            </a>
            <a
              href="#stats"
              className="text-foreground hover:text-[#0038A8] transition-colors font-medium"
            >
              Research
            </a>
            <a
              href="#assistant"
              className="text-foreground hover:text-[#0038A8] transition-colors font-medium"
            >
              AI Guide
            </a>
            <button 
              onClick={() => router.push("/login")}
              className="bg-[#0038A8] text-white px-5 py-2 rounded-md font-bold hover:bg-[#002D86] transition-all transform hover:scale-105 shadow-sm shadow-[#0038A8]/20"
            >
              Apply Now
            </button>
          </div>

          {/* Mobile button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300"
            >
              {isOpen ? (
                <X className="w-8 h-8" />
              ) : (
                <Menu className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-gray-800 px-4 pt-2 pb-6 space-y-4">
          <a
            href="#home"
            className="block text-gray-600 dark:text-gray-300 hover:text-[#0038A8] text-lg font-medium"
          >
            Overview
          </a>
          <a
            href="#programs"
            className="block text-gray-600 dark:text-gray-300 hover:text-[#0038A8] text-lg font-medium"
          >
            Programs
          </a>
          <a
            href="#stats"
            className="block text-gray-600 dark:text-gray-300 hover:text-[#0038A8] text-lg font-medium"
          >
            Research
          </a>
          <a
            href="#assistant"
            className="block text-gray-600 dark:text-gray-300 hover:text-[#0038A8] text-lg font-medium"
          >
            AI Guide
          </a>
          <button 
            onClick={() => router.push("/login")}
            className="w-full bg-[#0038A8] text-white px-5 py-3 rounded-md font-bold text-center hover:bg-[#002D86] shadow-sm shadow-[#0038A8]/20 transition-colors"
          >
            Apply Now
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
