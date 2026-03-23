import { createContext, useState, useEffect, useContext } from "react";
import { api } from "@/lib/api";
import type { academicYear, user } from "@/types";

// 1. Create Context
const AuthContext = createContext<{
  user: user | null;
  setUser: React.Dispatch<React.SetStateAction<user | null>>;
  loading: boolean;
  year: academicYear | null;
}>({
  user: null,
  setUser: () => {},
  loading: true,
  year: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<user | null>(null);
  const [loading, setLoading] = useState(true); // <--- Vital for preventing "flicker"
  const [year, setYear] = useState<academicYear | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if token exists before making request
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, skipping auth check");
        setLoading(false);
        setUser(null);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get("/users/profile");
        console.log("Auth user data:", data);
        // Ensure role is a string
        if (data.user && typeof data.user.role === 'object') {
          data.user.role = data.user.role.name || data.user.role;
        }
        setUser(data.user);
      } catch (error) {
        console.log("Auth check failed:", error);
        setLoading(false);
        setUser(null);
      }
    };
    const fetchYear = async () => {
      try {
        const { data } = await api.get("/academic-years/current");
        console.log("Academic year data:", data);
        setYear(data);
        setLoading(false);
      } catch (error) {
        console.log("Year fetch failed:", error);
        setLoading(false);
        setYear(null);
      }
    };

    checkAuth();
    fetchYear();

    // Listen for storage changes (logout from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        console.log("Token removed, logging out");
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, year }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
