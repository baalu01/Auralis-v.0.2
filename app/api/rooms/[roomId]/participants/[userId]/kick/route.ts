import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { roomId: string; userId: string } }) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const roomId = params.roomId
    const targetUserId = params.userId

    // Check if user is admin of the room
    const rooms = await sql`
      SELECT created_by FROM rooms
      WHERE id = ${roomId}
    `

    if (rooms.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (rooms[0].created_by !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Remove participant from room
    await sql`
      DELETE FROM room_participants
      WHERE room_id = ${roomId} AND user_id = ${targetUserId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Kick participant error:", error)
    return NextResponse.json({ error: "Failed to kick participant" }, { status: 500 })
  }
}
