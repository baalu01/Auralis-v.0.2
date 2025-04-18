"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type Notification = {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  createdAt: Date
  data?: any
}

type NotificationsProps = {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: number) => void
  onMarkAllAsRead: () => void
}

export function Notifications({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead }: NotificationsProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission()
    }
  }, [])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬"
      case "mention":
        return "@️"
      case "reaction":
        return "👍"
      case "invite":
        return "📨"
      case "recording":
        return "🎙️"
      default:
        return "🔔"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="text-sm font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2 rounded-md ${!notification.read ? "bg-muted" : "hover:bg-muted/50"}`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex gap-2">
                    <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{notification.title}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(notification.createdAt)}</div>
                      </div>
                      <p className="text-sm">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
