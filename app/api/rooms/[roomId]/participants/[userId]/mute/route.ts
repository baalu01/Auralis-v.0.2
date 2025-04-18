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

    // Set mute status for participant
    // In a real app, this would be stored in the database
    // For this demo, we'll just return success

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mute participant error:", error)
    return NextResponse.json({ error: "Failed to mute participant" }, { status: 500 })
  }
}
