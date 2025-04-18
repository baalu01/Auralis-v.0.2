"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Smile } from "lucide-react"

const EMOJI_CATEGORIES = {
  "Smileys & Emotion": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
  ],
  "People & Body": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "👋", "🤚", "🖐️", "✋", "🖖"],
  "Animals & Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵"],
  "Food & Drink": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝"],
  Activities: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🏒", "🏑", "🥍"],
  Objects: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼"],
  Symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗"],
}

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(EMOJI_CATEGORIES)[0])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to active category
    if (containerRef.current && open) {
      const categoryElement = containerRef.current.querySelector(`[data-category="${activeCategory}"]`)
      if (categoryElement) {
        categoryElement.scrollIntoView({ behavior: "smooth" })
      }
    }
  }, [activeCategory, open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Smile className="h-5 w-5" />
          <span className="sr-only">Emoji picker</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-2 flex overflow-x-auto">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "ghost"}
              size="sm"
              className="px-2 py-1 text-xs whitespace-nowrap"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <div className="h-60 overflow-y-auto p-2" ref={containerRef}>
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} data-category={category}>
              <h3 className="text-xs font-medium text-muted-foreground mb-1">{category}</h3>
              <div className="grid grid-cols-8 gap-1 mb-3">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted"
                    onClick={() => {
                      onEmojiSelect(emoji)
                      setOpen(false)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
