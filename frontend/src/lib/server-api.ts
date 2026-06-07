import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type FetchOptions = RequestInit & {
  headers?: Record<string, string>;
  token?: string; // 💡 Custom addition to pass an explicit server-side token string
};

export const serverFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const { headers: customHeaders, token: passedToken, ...restOfOptions } = options;
  let token = passedToken || "";

  // Only read from cookies fallback if no token was directly forwarded to the utility
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
    } catch (e) {
      // cookies() can only be called in server context; ignore during static pre-renders
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...restOfOptions,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const message = await res.text();
      // If unauthorized or user missing (e.g. database reset), drop to login page cleanly
      if (res.status === 401 || message.includes("User not found")) {
        redirect("/login?clear=1");
      }
      throw new Error(message || `Request failed: ${res.status}`);
    }

    return await res.json() as T;
  } catch (err: any) {
    // 🛠️ Rethrow native Next.js redirect execution triggers immediately
    if (err?.message === "NEXT_REDIRECT" || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }

    console.error(`serverFetch failed for ${path}:`, err.message || err);
    
    const cleanPath = path.split("?")[0];
    const segments = cleanPath.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";
    
    const isId = /^\d+$/.test(lastSegment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
    
    if (isId) return null as unknown as T;
    if (segments.length >= 3) return [] as unknown as T;
    return { data: [], meta: { total: 0 } } as unknown as T;
  }
};