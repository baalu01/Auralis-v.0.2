"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EmojiPicker } from "@/components/emoji-picker"
import { SmilePlus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type MessageReactionsProps = {
  messageId: number
  reactions: Record<string, number[]>
  onAddReaction: (messageId: number, emoji: string) => void
  currentUserId: number
}

export function MessageReactions({ messageId, reactions = {}, onAddReaction, currentUserId }: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleEmojiSelect = (emoji: string) => {
    onAddReaction(messageId, emoji)
    setShowPicker(false)
  }

  // Count total reactions
  const totalReactions = Object.values(reactions).reduce((sum, users) => sum + users.length, 0)

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(reactions).map(([emoji, userIds]) => {
        if (userIds.length === 0) return null

        const hasReacted = userIds.includes(currentUserId)

        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasReacted ? "default" : "outline"}
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => onAddReaction(messageId, emoji)}
                >
                  <span>{emoji}</span>
                  <span>{userIds.length}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {hasReacted ? "You and " : ""}
                  {hasReacted ? userIds.length - 1 : userIds.length} others
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}

      {showPicker ? (
        <div className="relative">
          <div className="absolute bottom-8 right-0 z-10">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full" onClick={() => setShowPicker(true)}>
          <SmilePlus className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
