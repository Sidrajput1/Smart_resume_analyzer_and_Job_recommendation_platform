import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

export default auth((req: {
    nextUrl: any; auth: any 
}) => {
    const session = req.auth;
    const path = req.nextUrl.pathname;

    const isLoggedIn = !!session?.user;
    const role = session?.user?.role;


     const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
  const isCandidateRoute = path.startsWith("/candidate");
  const isRecruiterRoute = path.startsWith("/recruiter");
  const isAdminRoute = path.startsWith("/admin");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if ((isCandidateRoute || isRecruiterRoute || isAdminRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isCandidateRoute && role !== "CANDIDATE") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (isRecruiterRoute && role !== "RECRUITER") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/register", "/candidate/:path*", "/recruiter/:path*", "/admin/:path*"],
};
