import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"
import { sql } from "./db"

// In a real app, you'd store this in an environment variable
const JWT_SECRET = new TextEncoder().encode("your-secret-key")

export async function getUserFromRequest(request: Request) {
  // For API routes
  const authHeader = request.headers.get("Authorization")
  let token

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7)
  } else {
    // Try to get from cookie
    const cookieHeader = request.headers.get("Cookie")
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader)
      token = cookies["auth-token"]
    }
  }

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (!payload.sub) return null

    const users = await sql`
      SELECT id, username, email, display_name, avatar_url
      FROM users
      WHERE id = ${payload.sub}
    `

    if (users.length === 0) return null

    const user = users[0]

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

// Helper function to parse cookies from header
function parseCookies(cookieHeader: string) {
  const cookies: Record<string, string> = {}
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=")
    cookies[name] = value
  })
  return cookies
}

export async function getUser() {
  // For server components
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (!payload.sub) return null

    const users = await sql`
      SELECT id, username, email, display_name, avatar_url
      FROM users
      WHERE id = ${payload.sub}
    `

    if (users.length === 0) return null

    const user = users[0]

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (!payload.sub) return null

    return {
      id: payload.sub,
      username: payload.username,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
    }
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

export async function createJWT(user: { id: number; username: string; displayName?: string; avatarUrl?: string }) {
  return await new SignJWT({
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id.toString())
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}
