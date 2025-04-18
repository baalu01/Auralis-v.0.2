import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get notifications for the user
    const notifications = await sql`
      SELECT id, type, title, message, read, created_at, data
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.created_at,
        data: n.data ? JSON.parse(n.data) : undefined,
      })),
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 })
  }
}
