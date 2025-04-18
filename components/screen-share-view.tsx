"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Monitor } from "lucide-react"

type ScreenShareViewProps = {
  stream: MediaStream | null
  sharingUserId: number | null
  participants: {
    id: number
    username: string
    displayName?: string
  }[]
}

export function ScreenShareView({ stream, sharingUserId, participants }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Get the name of the user who is sharing
  const sharingUser = participants.find((p) => p.id === sharingUserId)
  const sharingUserName = sharingUser ? sharingUser.displayName || sharingUser.username : "Unknown user"

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!stream) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto bg-black"
            style={{ aspectRatio: "16/9" }}
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center">
            <Monitor className="h-4 w-4 mr-1" />
            <span>{sharingUserName} is sharing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
