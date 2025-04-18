"use server"

import { sql, generateRoomCode } from "@/lib/db"
import { cookies } from "next/headers"

export type Message = {
  id: number
  roomId: number
  userId: number
  username: string
  displayName?: string
  content: string
  createdAt: Date
  avatarUrl?: string
  encrypted?: boolean
  publicKey?: string
  reactions?: Record<string, number[]>
  files?: {
    id: number
    name: string
    url: string
    type: string
    size: number
  }[]
}

export type Room = {
  id: number
  code: string
  name: string
  createdBy: number
  isPersistent: boolean
  createdAt: Date
  lastActive: Date
  participantCount?: number
}

// Create a new room
export async function createRoom(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const isPersistent = formData.get("isPersistent") === "on"

    if (!name) {
      return { success: false, error: "Room name is required" }
    }

    // Get current user
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify token and get user
    // This is simplified - in a real app, you'd verify the JWT
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Generate a unique room code
    let code = generateRoomCode()
    let isCodeUnique = false

    // Ensure code is unique
    while (!isCodeUnique) {
      const existingRoom = await sql`SELECT id FROM rooms WHERE code = ${code}`
      if (existingRoom.length === 0) {
        isCodeUnique = true
      } else {
        code = generateRoomCode()
      }
    }

    // Create room
    const result = await sql`
      INSERT INTO rooms (code, name, created_by, is_persistent)
      VALUES (${code}, ${name}, ${user.id}, ${isPersistent})
      RETURNING id, code, name, created_by, is_persistent, created_at
    `

    const room = result[0]

    // Add creator as participant
    await sql`
      INSERT INTO room_participants (room_id, user_id)
      VALUES (${room.id}, ${user.id})
    `

    return {
      success: true,
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
    }
  } catch (error) {
    console.error("Create room error:", error)
    return { success: false, error: "Failed to create room" }
  }
}

// Join a room
export async function joinRoom(code: string) {
  try {
    if (!code) {
      return { success: false, error: "Room code is required" }
    }

    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Find room
    const rooms = await sql`
      SELECT id, name FROM rooms WHERE code = ${code}
    `

    if (rooms.length === 0) {
      return { success: false, error: "Room not found" }
    }

    const roomId = rooms[0].id
    const roomName = rooms[0].name

    // Check if user is already a participant
    const existingParticipant = await sql`
      SELECT id FROM room_participants
      WHERE room_id = ${roomId} AND user_id = ${user.id}
    `

    if (existingParticipant.length === 0) {
      // Add user as participant
      await sql`
        INSERT INTO room_participants (room_id, user_id)
        VALUES (${roomId}, ${user.id})
      `
    }

    // Update last active timestamp
    await sql`
      UPDATE rooms
      SET last_active = CURRENT_TIMESTAMP
      WHERE id = ${roomId}
    `

    return {
      success: true,
      roomId,
      roomName,
    }
  } catch (error) {
    console.error("Join room error:", error)
    return { success: false, error: "Failed to join room" }
  }
}

// Get room details
export async function getRoomDetails(code: string) {
  try {
    if (!code) {
      return null
    }

    // Get room details
    const rooms = await sql`
      SELECT id, code, name, created_by, is_persistent, created_at, last_active
      FROM rooms
      WHERE code = ${code}
    `

    if (rooms.length === 0) {
      return null
    }

    const room = rooms[0]

    return {
      id: room.id,
      code: room.code,
      name: room.name,
      createdBy: room.created_by,
      isPersistent: room.is_persistent,
      createdAt: room.created_at,
      lastActive: room.last_active,
    }
  } catch (error) {
    console.error("Get room details error:", error)
    return null
  }
}

// Get room participants
export async function getRoomParticipants(roomId: number) {
  try {
    // Get participants
    const participants = await sql`
      SELECT u.id, u.username, u.display_name, u.avatar_url, rp.joined_at
      FROM room_participants rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ${roomId}
    `

    return participants.map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      joinedAt: p.joined_at,
    }))
  } catch (error) {
    console.error("Get participants error:", error)
    return []
  }
}

// Send a message
export async function sendMessage(roomId: number, content: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Create message
    const result = await sql`
      INSERT INTO messages (room_id, user_id, content)
      VALUES (${roomId}, ${user.id}, ${content})
      RETURNING id, content, created_at
    `

    const message = result[0]

    return {
      success: true,
      message: {
        id: message.id,
        roomId,
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        content: message.content,
        createdAt: message.created_at,
        avatarUrl: user.avatarUrl,
      },
    }
  } catch (error) {
    console.error("Send message error:", error)
    return { success: false, error: "Failed to send message" }
  }
}

// Get room messages
export async function getRoomMessages(roomId: number) {
  try {
    // Get messages
    const messages = await sql`
      SELECT m.id, m.content, m.created_at, u.id as user_id, u.username, u.display_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ${roomId}
      ORDER BY m.created_at ASC
    `

    return messages.map((msg) => ({
      id: msg.id,
      roomId,
      userId: msg.user_id,
      username: msg.username,
      displayName: msg.display_name,
      content: msg.content,
      createdAt: msg.created_at,
      avatarUrl: msg.avatar_url,
    }))
  } catch (error) {
    console.error("Get messages error:", error)
    return []
  }
}

// Leave room
export async function leaveRoom(roomId: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Remove user from room participants
    await sql`
      DELETE FROM room_participants
      WHERE room_id = ${roomId} AND user_id = ${user.id}
    `

    return { success: true }
  } catch (error) {
    console.error("Leave room error:", error)
    return { success: false, error: "Failed to leave room" }
  }
}

// Helper function to get current user
async function getCurrentUser() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) return null

  try {
    // In a real app, you'd verify the JWT
    // This is simplified for demo purposes
    const users = await sql`
      SELECT id, username, email, display_name, avatar_url
      FROM users
      WHERE id = 1 -- Hardcoded for demo
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
