"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser } from "@/app/actions/auth"

type ProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("/placeholder.svg?height=128&width=128")
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      setLoading(true)
      getCurrentUser().then((user) => {
        if (user) {
          setDisplayName(user.displayName || user.username)
          setAvatarUrl(user.avatarUrl || "/placeholder.svg?height=128&width=128")
        }
        setLoading(false)
      })
    }
  }, [open])

  const handleSave = () => {
    // In a real app, you would save the profile changes to the database
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your profile and audio settings.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="animate-pulse h-8 w-8 rounded-full bg-muted"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 py-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  Change Avatar
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" placeholder="What's on your mind?" />
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inputDevice">Input Device</Label>
                <select
                  id="inputDevice"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>Default Microphone</option>
                  <option>Headset Microphone</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputDevice">Output Device</Label>
                <select
                  id="outputDevice"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>Default Speakers</option>
                  <option>Headphones</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Input Volume</Label>
                <div className="flex items-center gap-2">
                  <input type="range" className="w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Output Volume</Label>
                <div className="flex items-center gap-2">
                  <input type="range" className="w-full" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
