"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, File, FileText, Film, Music, ImageIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type FileUploadProps = {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string
}

export function FileUpload({ onFilesSelected, maxFiles = 5, maxSize = 10, accept }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files`)
      return
    }

    const oversizedFiles = files.filter((file) => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the maximum size of ${maxSize}MB`)
      return
    }

    setError(null)
    setSelectedFiles((prev) => [...prev, ...files])

    // Simulate upload progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 10
      setProgress(currentProgress)
      if (currentProgress >= 100) {
        clearInterval(interval)
        onFilesSelected(files)
      }
    }, 200)
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    const type = file.type.split("/")[0]
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Film className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "text":
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= maxFiles}
        >
          <Paperclip className="h-4 w-4 mr-1" />
          Attach
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple accept={accept} />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
              {getFileIcon(file)}
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {progress > 0 && progress < 100 && <Progress value={progress} className="h-1" />}
        </div>
      )}
    </div>
  )
}
