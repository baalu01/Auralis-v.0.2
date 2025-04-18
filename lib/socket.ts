import type { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { NextApiRequest } from "next"
import type { NextApiResponse } from "next"
import { verifyJWT } from "./auth"

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function SocketHandler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server)
    res.socket.server.io = io

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
        io.to(`room:${roomId}`).emit("user-connected", {
          userId: socket.data.user.id,
          username: socket.data.user.username,
          displayName: socket.data.user.displayName,
          avatarUrl: socket.data.user.avatarUrl,
        })
      })

      socket.on("leave-room", (roomId) => {
        socket.leave(`room:${roomId}`)
        io.to(`room:${roomId}`).emit("user-disconnected", socket.data.user.id)
      })

      socket.on("signal", ({ userId, signal }) => {
        io.to(`user:${userId}`).emit("signal", {
          userId: socket.data.user.id,
          signal,
        })
      })

      // Screen sharing signals
      socket.on("screen-signal", ({ userId, signal }) => {
        io.to(`user:${userId}`).emit("screen-signal", {
          userId: socket.data.user.id,
          signal,
        })
      })

      socket.on("screen-share-started", ({ roomId }) => {
        io.to(`room:${roomId}`).emit("screen-share-started", {
          userId: socket.data.user.id,
        })
      })

      socket.on("screen-share-stopped", ({ roomId }) => {
        io.to(`room:${roomId}`).emit("screen-share-stopped", {
          userId: socket.data.user.id,
        })
      })

      socket.on("get-participants", ({ roomId }, callback) => {
        const room = io.sockets.adapter.rooms.get(`room:${roomId}`)
        const participants: number[] = []

        if (room) {
          // Get all socket IDs in the room
          for (const socketId of room) {
            const participantSocket = io.sockets.sockets.get(socketId)
            if (participantSocket && participantSocket.data.user) {
              participants.push(participantSocket.data.user.id)
            }
          }
        }

        callback(participants)
      })

      socket.on("message", ({ roomId, message }) => {
        io.to(`room:${roomId}`).emit("message", {
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
        io.to(`room:${roomId}`).emit("reaction", {
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

  res.end()
}
