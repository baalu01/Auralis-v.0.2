import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fileId = params.id

    // Get file metadata from database
    const files = await sql`
      SELECT f.*, r.id as room_id
      FROM files f
      JOIN rooms r ON f.room_id = r.id
      WHERE f.id = ${fileId}
    `

    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = files[0]

    // Check if user has access to the room
    const participants = await sql`
      SELECT id FROM room_participants
      WHERE room_id = ${file.room_id} AND user_id = ${user.id}
    `

    if (participants.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real app, you would retrieve the file from storage
    // For this demo, we'll return a placeholder
    return new NextResponse("File content would be here", {
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.name}"`,
      },
    })
  } catch (error) {
    console.error("File download error:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
}
