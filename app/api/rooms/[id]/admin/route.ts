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

    // Check if user is admin of the room
    const rooms = await sql`
      SELECT created_by FROM rooms
      WHERE id = ${roomId}
    `

    if (rooms.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const isAdmin = rooms[0].created_by === user.id

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error("Check admin error:", error)
    return NextResponse.json({ error: "Failed to check admin status" }, { status: 500 })
  }
}
