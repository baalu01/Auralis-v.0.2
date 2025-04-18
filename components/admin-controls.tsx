"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Shield, MicOff, UserX, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Participant = {
  id: number
  username: string
  displayName?: string
  avatarUrl?: string
  isMuted?: boolean
  isAdmin?: boolean
}

type AdminControlsProps = {
  isAdmin: boolean
  participants: Participant[]
  onMuteParticipant: (participantId: number) => void
  onKickParticipant: (participantId: number) => void
  onMakeAdmin: (participantId: number) => void
}

export function AdminControls({
  isAdmin,
  participants,
  onMuteParticipant,
  onKickParticipant,
  onMakeAdmin,
}: AdminControlsProps) {
  const [open, setOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [showKickDialog, setShowKickDialog] = useState(false)

  if (!isAdmin) return null

  const handleKickClick = (participant: Participant) => {
    setSelectedParticipant(participant)
    setShowKickDialog(true)
  }

  const confirmKick = () => {
    if (selectedParticipant) {
      onKickParticipant(selectedParticipant.id)
      setShowKickDialog(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
            <Shield className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="end">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Admin Controls</h3>
            <p className="text-xs text-muted-foreground">Manage participants in this room</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{(participant.displayName || participant.username).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{participant.displayName || participant.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {participant.isAdmin ? "Admin" : "Participant"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMuteParticipant(participant.id)}
                    >
                      <MicOff className="h-4 w-4" />
                    </Button>
                    {!participant.isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleKickClick(participant)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onMakeAdmin(participant.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kick Participant</DialogTitle>
            <DialogDescription>Are you sure you want to remove this participant from the room?</DialogDescription>
          </DialogHeader>
          {selectedParticipant && (
            <div className="flex items-center gap-2 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedParticipant.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback>
                  {(selectedParticipant.displayName || selectedParticipant.username).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedParticipant.displayName || selectedParticipant.username}</div>
                <div className="text-sm text-muted-foreground">{selectedParticipant.username}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKickDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmKick}>
              Kick
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
