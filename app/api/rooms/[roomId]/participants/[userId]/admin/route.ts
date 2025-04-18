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

    // In a real app, you would update the database to make the user an admin
    // For this demo, we'll just return success

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Make admin error:", error)
    return NextResponse.json({ error: "Failed to make admin" }, { status: 500 })
  }
}
