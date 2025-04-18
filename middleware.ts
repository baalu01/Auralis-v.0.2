import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("auth")
  const path = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedRoutes = ["/create", "/lobby"]

  // Public routes that should redirect to home if already authenticated
  const authRoutes = ["/login", "/signup"]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some((route) => path === route)

  // If trying to access a protected route without being logged in
  if (isProtectedRoute && !authCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If trying to access login/signup while already logged in
  if (isAuthRoute && authCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/create/:path*", "/lobby/:path*", "/login", "/signup"],
}
