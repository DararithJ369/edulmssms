import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export const serverFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  let token = "";
  try {
    const cookieStore = cookies();
    token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
  } catch (e) {
    // cookies() can only be called in server context; ignore if called during pre-render without request context
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const message = await res.text();
      // If the token is invalid or the user is not found (e.g. after a database reset),
      // redirect to the login page cleanly instead of throwing a runtime crash error.
      if (res.status === 401 || message.includes("User not found")) {
        redirect("/login?clear=1");
      }
      throw new Error(message || `Request failed: ${res.status}`);
    }

    return await res.json() as T;
  } catch (err: any) {
    console.error(`serverFetch failed for ${path}:`, err.message || err);
    
    // Split the path into segments to analyze its resource type
    const cleanPath = path.split("?")[0];
    const segments = cleanPath.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";
    
    // Check if the last segment is a dynamic identifier (number or UUID)
    const isId = /^\d+$/.test(lastSegment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
    
    if (isId) {
      // Single-resource detail endpoint (e.g. /lessons/12)
      return null as unknown as T;
    }
    
    // Sub-resource lists (e.g. /students/123/attendance, /classes/1/sessions) always return raw arrays
    const isSubResourceList = segments.length >= 3;
    if (isSubResourceList) {
      return [] as unknown as T;
    }
    
    // Primary list endpoints (e.g. /assignments, /users/parents) return paginated envelopes
    return { data: [], meta: { total: 0 } } as unknown as T;
  }
};

