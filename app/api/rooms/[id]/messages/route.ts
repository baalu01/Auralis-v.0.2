import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roomId = params.id

    // Check if user is a participant in the room
    const participants = await sql`
      SELECT id FROM room_participants
      WHERE room_id = ${roomId} AND user_id = ${user.id}
    `

    if (participants.length === 0) {
      return NextResponse.json({ error: "Not a participant in this room" }, { status: 403 })
    }

    // Get messages
    const messages = await sql`
      SELECT m.id, m.content, m.created_at, m.encrypted, m.public_key,
             u.id as user_id, u.username, u.display_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ${roomId}
      ORDER BY m.created_at ASC
      LIMIT 100
    `

    // Get reactions for these messages
    const messageIds = messages.map((m: any) => m.id)
    const reactions = await sql`
      SELECT r.message_id, r.emoji, r.user_id
      FROM reactions r
      WHERE r.message_id = ANY(${messageIds})
    `

    // Group reactions by message and emoji
    const reactionsByMessage: Record<number, Record<string, number[]>> = {}
    for (const reaction of reactions) {
      if (!reactionsByMessage[reaction.message_id]) {
        reactionsByMessage[reaction.message_id] = {}
      }
      if (!reactionsByMessage[reaction.message_id][reaction.emoji]) {
        reactionsByMessage[reaction.message_id][reaction.emoji] = []
      }
      reactionsByMessage[reaction.message_id][reaction.emoji].push(reaction.user_id)
    }

    // Get files for these messages
    const files = await sql`
      SELECT f.id, f.message_id, f.name, f.type, f.size, f.url
      FROM files f
      WHERE f.message_id = ANY(${messageIds})
    `

    // Group files by message
    const filesByMessage: Record<number, any[]> = {}
    for (const file of files) {
      if (!filesByMessage[file.message_id]) {
        filesByMessage[file.message_id] = []
      }
      filesByMessage[file.message_id].push({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
      })
    }

    // Format messages with reactions and files
    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      roomId: Number.parseInt(roomId),
      userId: msg.user_id,
      username: msg.username,
      displayName: msg.display_name,
      content: msg.content,
      createdAt: msg.created_at,
      avatarUrl: msg.avatar_url,
      encrypted: msg.encrypted,
      publicKey: msg.public_key,
      reactions: reactionsByMessage[msg.id] || {},
      files: filesByMessage[msg.id] || [],
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 })
  }
}
