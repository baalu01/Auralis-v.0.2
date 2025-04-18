"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Clock, MinusCircle, User } from "lucide-react"

type UserStatus = "online" | "away" | "busy" | "offline"

type UserStatusProps = {
  user: {
    id: number
    username: string
    displayName?: string
    avatarUrl?: string
  }
  status: UserStatus
  onStatusChange: (status: UserStatus) => void
}

export function UserStatus({ user, status, onStatusChange }: UserStatusProps) {
  const statusIcons = {
    online: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    away: <Clock className="h-4 w-4 text-yellow-500" />,
    busy: <MinusCircle className="h-4 w-4 text-red-500" />,
    offline: <User className="h-4 w-4 text-gray-500" />,
  }

  const statusLabels = {
    online: "Online",
    away: "Away",
    busy: "Do Not Disturb",
    offline: "Invisible",
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
            <AvatarFallback>{(user.displayName || user.username).charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{user.displayName || user.username}</span>
          <div className="flex items-center gap-1">
            {statusIcons[status]}
            <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Set Status</h3>
          <div className="space-y-1">
            {(Object.keys(statusLabels) as UserStatus[]).map((s) => (
              <button
                key={s}
                className={`w-full flex items-center gap-2 p-2 rounded-md text-sm ${
                  status === s ? "bg-muted" : "hover:bg-muted"
                }`}
                onClick={() => onStatusChange(s)}
              >
                {statusIcons[s]}
                <span>{statusLabels[s]}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
