import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const roomId = formData.get("roomId")
    const files = formData.getAll("files")

    if (!roomId || !files.length) {
      return NextResponse.json({ error: "Missing roomId or files" }, { status: 400 })
    }

    // In a real app, you would upload files to a storage service
    // For this demo, we'll simulate file storage
    const uploadedFiles = []

    for (const file of files) {
      if (!(file instanceof File)) continue

      // Generate a unique file ID
      const fileId = Date.now() + Math.random().toString(36).substring(2, 15)

      // In a real app, upload the file to a storage service
      // For this demo, we'll just store metadata
      const fileData = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/api/files/${fileId}`, // This would be a real URL in production
      }

      // Store file metadata in database
      await sql`
        INSERT INTO files (id, room_id, user_id, name, type, size, url)
        VALUES (${fileId}, ${roomId}, ${user.id}, ${file.name}, ${file.type}, ${file.size}, ${fileData.url})
      `

      uploadedFiles.push(fileData)
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
