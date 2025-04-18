"use client"

import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

type UserStatus = "online" | "away" | "busy" | "offline"

type User = {
  id: number
  username: string
  displayName?: string
  avatarUrl?: string
  status: UserStatus
  lastActive?: Date
}

export function usePresence(userId: number, token: string) {
  const [users, setUsers] = useState<Record<number, User>>({})
  const [status, setStatus] = useState<UserStatus>("online")
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      path: "/api/socket",
      auth: { token },
    })

    socketInstance.on("connect", () => {
      // Send initial status
      socketInstance.emit("status-change", { status })
    })

    socketInstance.on("user-status", ({ userId, status }: { userId: number; status: UserStatus }) => {
      setUsers((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          status,
          lastActive: new Date(),
        },
      }))
    })

    socketInstance.on("users-list", (usersList: User[]) => {
      const usersMap: Record<number, User> = {}
      usersList.forEach((user) => {
        usersMap[user.id] = user
      })
      setUsers(usersMap)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [userId, token, status])

  // Load initial users list
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const usersMap: Record<number, User> = {}
        data.users.forEach((user: User) => {
          usersMap[user.id] = user
        })
        setUsers(usersMap)
      })
      .catch((err) => {
        console.error("Error loading users:", err)
      })
  }, [])

  const updateStatus = useCallback(
    (newStatus: UserStatus) => {
      setStatus(newStatus)
      socket?.emit("status-change", { status: newStatus })
    },
    [socket],
  )

  return {
    users,
    status,
    updateStatus,
  }
}
