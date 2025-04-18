"use client"

import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

type NotificationType = "message" | "mention" | "reaction" | "invite" | "recording"

type Notification = {
  id: number
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Date
  data?: any
}

export function useNotifications(userId: number, token: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setPermissionGranted(permission === "granted")
      })
    }
  }, [])

  // Connect to socket for real-time notifications
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      path: "/api/socket",
      auth: { token },
    })

    socketInstance.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Show browser notification if permission granted
      if (permissionGranted) {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/icon-192x192.png",
        })
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [userId, token, permissionGranted])

  // Load initial notifications
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
      })
      .catch((err) => {
        console.error("Error loading notifications:", err)
      })
  }, [])

  const markAsRead = useCallback((notificationId: number) => {
    fetch(`/api/notifications/${notificationId}/read`, {
      method: "POST",
    })
      .then(() => {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      })
      .catch((err) => {
        console.error("Error marking notification as read:", err)
      })
  }, [])

  const markAllAsRead = useCallback(() => {
    fetch("/api/notifications/read-all", {
      method: "POST",
    })
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      })
      .catch((err) => {
        console.error("Error marking all notifications as read:", err)
      })
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
