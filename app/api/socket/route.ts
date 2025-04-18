import { NextResponse } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { verifyJWT } from "@/lib/auth"

// Store the Socket.IO server instance
let io: SocketIOServer | null = null

export async function GET(request: Request) {
  // This is a workaround for Next.js App Router
  // In a production app, you would use a proper WebSocket server

  // Return a response to acknowledge the request
  return new NextResponse("WebSocket server is running", {
    headers: {
      "Content-Type": "text/plain",
    },
  })
}

// This is a simplified version for demonstration
// In a real app, you would use a proper WebSocket server
export function getSocketIO() {
  if (!io) {
    // Create a new Socket.IO server
    io = new SocketIOServer({
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    })

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error("Authentication error"))
        }

        const user = await verifyJWT(token)
        if (!user) {
          return next(new Error("Authentication error"))
        }

        socket.data.user = user
        next()
      } catch (error) {
        next(new Error("Authentication error"))
      }
    })

    io.on("connection", (socket) => {
      console.log("New client connected")

      socket.on("join-room", (roomId) => {
        socket.join(`room:${roomId}`)
        io?.to(`room:${roomId}`).emit("user-connected", {
          userId: socket.data.user.id,
          username: socket.data.user.username,
          displayName: socket.data.user.displayName,
          avatarUrl: socket.data.user.avatarUrl,
        })
      })

      socket.on("leave-room", (roomId) => {
        socket.leave(`room:${roomId}`)
        io?.to(`room:${roomId}`).emit("user-disconnected", socket.data.user.id)
      })

      socket.on("signal", ({ userId, signal }) => {
        io?.to(`user:${userId}`).emit("signal", {
          userId: socket.data.user.id,
          signal,
        })
      })

      socket.on("message", ({ roomId, message }) => {
        io?.to(`room:${roomId}`).emit("message", {
          ...message,
          user: {
            id: socket.data.user.id,
            username: socket.data.user.username,
            displayName: socket.data.user.displayName,
            avatarUrl: socket.data.user.avatarUrl,
          },
        })
      })

      socket.on("reaction", ({ roomId, messageId, reaction }) => {
        io?.to(`room:${roomId}`).emit("reaction", {
          messageId,
          reaction,
          userId: socket.data.user.id,
        })
      })

      socket.on("status-change", ({ status }) => {
        socket.broadcast.emit("user-status", {
          userId: socket.data.user.id,
          status,
        })
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected")
      })
    })
  }

  return io
}
