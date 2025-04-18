import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const roomId = params.id

    // Get participants of the room
    const participants = await sql`
      SELECT u.id, u.username, u.display_name, u.avatar_url, rp.joined_at,
             r.created_by = u.id as is_admin
      FROM room_participants rp
      JOIN users u ON rp.user_id = u.id
      JOIN rooms r ON rp.room_id = r.id
      WHERE rp.room_id = ${roomId}
    `

    return NextResponse.json({
      participants: participants.map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        joinedAt: p.joined_at,
        isAdmin: p.is_admin,
      })),
    })
  } catch (error) {
    console.error("Get participants error:", error)
    return NextResponse.json({ error: "Failed to get participants" }, { status: 500 })
  }
}
