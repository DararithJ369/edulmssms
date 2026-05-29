import { NextRequest, NextResponse } from "next/server";
import { routeAccessMap } from "./lib/settings";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: (pathname: string) => new RegExp(`^${route}$`).test(pathname),
  allowedRoles: routeAccessMap[route],
}));

const normalizeRole = (role: string) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role;
};

export default function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const accessToken = req.cookies.get("access_token")?.value || null;
  const userRoleCookie = req.cookies.get("user_role")?.value || null;
  const role = userRoleCookie ? normalizeRole(userRoleCookie) : null;

  // Self-healing auth redirect loop breaker:
  // If the server-api redirected the user to /login?clear=1 due to database reseeding,
  // we delete all outdated/invalid cookies and redirect cleanly to /login.
  if (pathname === "/login" && url.searchParams.has("clear")) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("access_token");
    response.cookies.delete("token");
    response.cookies.delete("user_role");
    return response;
  }

  const isProtectedRoute = matchers.some(({ matcher }) => matcher(pathname));

  if (pathname === "/login" && accessToken) {
    return NextResponse.redirect(new URL(`/${role || "home"}`, req.url));
  }


  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(pathname) && role && !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
