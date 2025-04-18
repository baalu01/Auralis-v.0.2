"use server"

import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { createJWT } from "@/lib/auth"
import { jwtVerify } from "jose"

export async function signUp(formData: FormData) {
  try {
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const displayName = formData.get("displayName") as string
    const password = formData.get("password") as string

    // Validate input
    if (!username || !email || !password) {
      return {
        success: false,
        errors: [{ message: "All fields are required" }],
      }
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username} OR email = ${email}
    `

    if (existingUser.length > 0) {
      return {
        success: false,
        errors: [{ message: "Username or email already exists" }],
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES (${username}, ${email}, ${passwordHash}, ${displayName || username})
      RETURNING id, username, email, display_name, created_at
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to create user record")
    }

    const user = {
      id: result[0].id,
      username: result[0].username,
      email: result[0].email,
      displayName: result[0].display_name,
    }

    // Create JWT token
    const token = await createJWT(user)

    // Set cookie
    cookies().set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    })

    // Also set a non-httpOnly cookie for client-side access
    cookies().set({
      name: "auth",
      value: "true",
      httpOnly: false,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return { success: true, user }
  } catch (error) {
    console.error("Signup error:", error)
    return {
      success: false,
      errors: [{ message: "Failed to create user" }],
    }
  }
}

export async function login(formData: FormData) {
  try {
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    console.log("Login attempt for:", username)

    // Validate input
    if (!username || !password) {
      return {
        success: false,
        errors: [{ message: "Username and password are required" }],
      }
    }

    // Find user
    const users = await sql`
      SELECT id, username, email, password_hash, display_name, avatar_url
      FROM users
      WHERE username = ${username} OR email = ${username}
    `

    console.log("Found users:", users.length)

    if (users.length === 0) {
      return {
        success: false,
        errors: [{ message: "Invalid credentials" }],
      }
    }

    const user = users[0]

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    console.log("Password match:", passwordMatch)

    if (!passwordMatch) {
      return {
        success: false,
        errors: [{ message: "Invalid credentials" }],
      }
    }

    // Create JWT token
    const token = await createJWT({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    })

    // Set cookie
    cookies().set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    })

    // Also set a non-httpOnly cookie for client-side access
    cookies().set({
      name: "auth",
      value: "true",
      httpOnly: false,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    })

    console.log("Login successful, token created")

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      errors: [{ message: "Failed to authenticate" }],
    }
  }
}

export async function logout() {
  cookies().delete("auth-token")
  cookies().delete("auth")
  redirect("/")
}

export async function getCurrentUser() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode("your-secret-key"))

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
    console.error("Get user error:", error)
    return null
  }
}
