"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RepeatIcon as Record, StopCircle, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type RecordingControlsProps = {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  canRecord: boolean
  onRequestPermission: () => void
}

export function RecordingControls({
  isRecording,
  onStartRecording,
  onStopRecording,
  canRecord,
  onRequestPermission,
}: RecordingControlsProps) {
  const [open, setOpen] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)

  const handleRecordClick = () => {
    if (isRecording) {
      onStopRecording()
    } else {
      if (canRecord) {
        onStartRecording()
      } else {
        setShowPermissionDialog(true)
      }
    }
  }

  const handleRequestPermission = () => {
    onRequestPermission()
    setShowPermissionDialog(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant={isRecording ? "destructive" : "outline"} size="icon" className="rounded-full h-10 w-10">
            {isRecording ? <StopCircle className="h-4 w-4" /> : <Record className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recording Controls</h3>
            <p className="text-xs text-muted-foreground">
              {isRecording ? "Recording in progress. Click stop to save." : "Start recording the audio session."}
            </p>
            <div className="flex justify-between">
              <Button variant={isRecording ? "destructive" : "default"} size="sm" onClick={handleRecordClick}>
                {isRecording ? (
                  <>
                    <StopCircle className="h-4 w-4 mr-1" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Record className="h-4 w-4 mr-1" />
                    Start Recording
                  </>
                )}
              </Button>
              {isRecording && (
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recording Permission Required</DialogTitle>
            <DialogDescription>You need permission from all participants to record this session.</DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Recording audio without consent may be illegal in some jurisdictions. Please ensure you have permission from
            all participants before recording.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestPermission}>Request Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
