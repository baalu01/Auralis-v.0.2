"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  MessageSquare,
  Monitor,
  Copy,
  Settings,
  Volume2,
  VolumeX,
  UserPlus,
  MoreVertical,
  Send,
  Loader2,
  Lock,
  Unlock,
  MonitorOff,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProfileDialog } from "@/components/profile-dialog"
import { EmojiPicker } from "@/components/emoji-picker"
import { FileUpload } from "@/components/file-upload"
import { VoiceEffects } from "@/components/voice-effects"
import { RecordingControls } from "@/components/recording-controls"
import { AdminControls } from "@/components/admin-controls"
import { Notifications } from "@/components/notifications"
import { UserStatus } from "@/components/user-status"
import { MessageReactions } from "@/components/message-reactions"
import { ScreenShareView } from "@/components/screen-share-view"
import { joinRoom, getRoomDetails, getRoomParticipants, leaveRoom } from "../actions/rooms"
import { getCurrentUser } from "../actions/auth"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useEncryptedChat } from "@/hooks/use-encrypted-chat"
import { usePresence } from "@/hooks/use-presence"
import { useNotifications } from "@/hooks/use-notifications"
import { useAdminControls } from "@/hooks/use-admin-controls"
import { useScreenSharing } from "@/hooks/use-screen-sharing"

type Participant = {
  id: number
  username: string
  displayName: string
  avatarUrl?: string
  isSpeaking?: boolean
  isMuted?: boolean
  isScreenSharing?: boolean
  status?: string
}

export default function LobbyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get("code")

  const [user, setUser] = useState<{ id: number; username: string; displayName?: string; avatarUrl?: string } | null>(
    null,
  )
  const [roomId, setRoomId] = useState<number | null>(null)
  const [roomName, setRoomName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string>("")

  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("voice")
  const [message, setMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch current user and token
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser()
        if (!userData) {
          router.push("/login")
          return
        }
        setUser(userData)

        // Get auth token from cookie
        const cookies = document.cookie.split(";")
        const tokenCookie = cookies.find((c) => c.trim().startsWith("auth-token="))
        if (tokenCookie) {
          const tokenValue = tokenCookie.split("=")[1]
          setToken(tokenValue)
        }
      } catch (err) {
        console.error("Error fetching user:", err)
        router.push("/login")
      }
    }

    fetchUser()
  }, [router])

  // Join room and fetch initial data
  useEffect(() => {
    if (!code || !user) return

    async function joinAndFetchData() {
      setLoading(true)
      setError(null)

      try {
        // Join the room
        const joinResult = await joinRoom(code)

        if (!joinResult.success) {
          setError(joinResult.error || "Failed to join room")
          setLoading(false)
          return
        }

        setRoomId(joinResult.roomId)
        setRoomName(joinResult.roomName || "Audio Space")

        // Fetch room details
        const roomDetails = await getRoomDetails(code)

        if (!roomDetails) {
          setError("Room not found")
          setLoading(false)
          return
        }

        // Fetch participants
        const participantsData = await getRoomParticipants(joinResult.roomId!)
        setParticipants(
          participantsData.map((p) => ({
            ...p,
            isSpeaking: false,
            isMuted: p.id === user.id ? isMuted : false,
            isScreenSharing: false,
            status: "online",
          })),
        )

        setLoading(false)
      } catch (err) {
        console.error("Error joining room:", err)
        setError("An error occurred while joining the room")
        setLoading(false)
      }
    }

    joinAndFetchData()
  }, [code, user, isMuted, router])

  // Initialize WebRTC when room and user are available
  const {
    peers,
    audioEnabled,
    toggleAudio,
    audioEffectEnabled,
    toggleAudioEffect,
    audioEffect,
    changeAudioEffect,
    effectIntensity,
    setEffectIntensity,
    isRecording,
    startRecording,
    stopRecording,
    requestRecordingPermission,
    grantRecordingPermission,
    recordingPermission,
  } = useWebRTC(roomId || 0, user?.id || 0, token)

  // Initialize screen sharing
  const {
    isSharing,
    startScreenShare,
    stopScreenShare,
    screenStream,
    viewingUserId,
    error: screenShareError,
  } = useScreenSharing(roomId || 0, user?.id || 0, token)

  // Initialize encrypted chat
  const {
    messages,
    sendMessage: sendChatMessage,
    encryptionEnabled,
    toggleEncryption,
    addReaction,
    isConnected,
  } = useEncryptedChat(roomId || 0, user?.id || 0, token)

  // Initialize presence system
  const { users: onlineUsers, status: userStatus, updateStatus } = usePresence(user?.id || 0, token)

  // Initialize notifications
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id || 0, token)

  // Initialize admin controls
  const { isAdmin, muteParticipant, kickParticipant, makeAdmin } = useAdminControls(roomId || 0, user?.id || 0)

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Update participants with online status
  useEffect(() => {
    if (Object.keys(onlineUsers).length > 0) {
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          status: onlineUsers[p.id]?.status || "offline",
        })),
      )
    }
  }, [onlineUsers])

  // Update participants with screen sharing status
  useEffect(() => {
    if (isSharing || viewingUserId) {
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isScreenSharing: isSharing ? p.id === user?.id : p.id === viewingUserId,
        })),
      )
    } else {
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isScreenSharing: false,
        })),
      )
    }
  }, [isSharing, viewingUserId, user?.id])

  // Simulate speaking indicators for demo
  useEffect(() => {
    const speakingInterval = setInterval(() => {
      setParticipants((prev) => {
        return prev.map((p) => {
          if (p.id !== user?.id && !p.isMuted && Math.random() > 0.7) {
            return { ...p, isSpeaking: !p.isSpeaking }
          }
          return p
        })
      })
    }, 2000)

    return () => {
      clearInterval(speakingInterval)
    }
  }, [user?.id])

  const toggleMute = () => {
    toggleAudio()
    setIsMuted(!isMuted)
    // Update your participant in the list
    setParticipants((prev) => prev.map((p) => (p.id === user?.id ? { ...p, isMuted: !isMuted } : p)))
  }

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened)
    // In a real app, this would mute all incoming audio
  }

  const toggleScreenShare = async () => {
    if (isSharing) {
      stopScreenShare()
    } else {
      const success = await startScreenShare()
      if (success) {
        // Update your participant in the list
        setParticipants((prev) => prev.map((p) => (p.id === user?.id ? { ...p, isScreenSharing: true } : p)))
      }
    }
  }

  const handleLeaveCall = async () => {
    if (roomId) {
      await leaveRoom(roomId)
    }
    router.push("/")
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(code || "")
    // You could add a toast notification here
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !roomId) return

    try {
      await sendChatMessage(message, selectedFiles)
      setMessage("")
      setSelectedFiles([])
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Joining audio space...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md">
                {error}
              </div>
              <Button onClick={() => router.push("/")}>Return Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b backdrop-blur-md bg-background/70">
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-semibold tracking-tight">Auralis</span>
          </Link>
        </div>
        <div className="ml-4 flex-1">
          <h1 className="text-lg font-medium truncate">{roomName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy Invite Code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{participants.length}</span>
          </Badge>

          <Badge variant="secondary">Code: {code}</Badge>

          <Notifications
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />

          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 p-4">
        <div className="space-y-4">
          {/* Screen sharing area */}
          {(isSharing || viewingUserId) && screenStream && (
            <ScreenShareView
              stream={screenStream}
              sharingUserId={isSharing ? user?.id || null : viewingUserId}
              participants={participants}
            />
          )}

          {/* Participants grid */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex flex-col items-center gap-2">
                    <div
                      className={`relative ${participant.isSpeaking ? "ring-2 ring-green-500 dark:ring-green-400 ring-offset-2 ring-offset-background" : ""}`}
                    >
                      <Avatar className="h-16 w-16 border-2 border-background">
                        <AvatarImage src={participant.avatarUrl || "/placeholder.svg?height=128&width=128"} />
                        <AvatarFallback>{(participant.displayName || participant.username).charAt(0)}</AvatarFallback>
                      </Avatar>
                      {participant.isMuted && (
                        <div className="absolute bottom-0 right-0 bg-red-500 text-white rounded-full p-1">
                          <MicOff className="h-3 w-3" />
                        </div>
                      )}
                      {participant.isScreenSharing && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-full p-1">
                          <Monitor className="h-3 w-3" />
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-background ${
                          participant.status === "online"
                            ? "bg-green-500"
                            : participant.status === "away"
                              ? "bg-yellow-500"
                              : participant.status === "busy"
                                ? "bg-red-500"
                                : "bg-gray-500"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium">{participant.displayName || participant.username}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat and controls sidebar */}
        <div className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="voice">
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="flex-1 flex flex-col">
              <Card className="flex-1">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Voice Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Input Volume</span>
                        <input type="range" className="w-32" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Output Volume</span>
                        <input type="range" className="w-32" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Voice Effects</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {audioEffectEnabled ? audioEffect : "Off"}
                          </span>
                          <Button
                            variant={audioEffectEnabled ? "default" : "outline"}
                            size="sm"
                            onClick={toggleAudioEffect}
                          >
                            {audioEffectEnabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">End-to-End Encryption</span>
                        <Button
                          variant={encryptionEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={toggleEncryption}
                          className="gap-1"
                        >
                          {encryptionEnabled ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {encryptionEnabled ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Participants</h3>
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={participant.avatarUrl || "/placeholder.svg?height=128&width=128"} />
                              <AvatarFallback>
                                {(participant.displayName || participant.username).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{participant.displayName || participant.username}</span>
                          </div>
                          {participant.isSpeaking && (
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 dark:bg-green-400 w-3/4"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className="flex gap-2">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={msg.avatarUrl || "/placeholder.svg?height=128&width=128"} />
                              <AvatarFallback>{(msg.displayName || msg.username).charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{msg.displayName || msg.username}</span>
                                <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                                {msg.encrypted && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                    <Lock className="h-2 w-2 mr-1" />
                                    Encrypted
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{msg.content}</p>

                              {/* File attachments */}
                              {msg.files && msg.files.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {msg.files.map((file) => (
                                    <a
                                      key={file.id}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 p-1 bg-muted rounded text-xs"
                                    >
                                      <File className="h-3 w-3" />
                                      <span className="truncate max-w-[100px]">{file.name}</span>
                                      <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)}KB)</span>
                                    </a>
                                  ))}
                                </div>
                              )}

                              {/* Message reactions */}
                              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <MessageReactions
                                  messageId={msg.id}
                                  reactions={msg.reactions}
                                  onAddReaction={addReaction}
                                  currentUserId={user?.id || 0}
                                />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type a message..."
                        className="min-h-[40px] max-h-[120px]"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage(e)
                          }
                        }}
                      />
                      <Button type="submit" size="icon" className="flex-shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <EmojiPicker onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)} />
                        <FileUpload onFilesSelected={handleFilesSelected} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={encryptionEnabled ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={toggleEncryption}
                        >
                          {encryptionEnabled ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {encryptionEnabled ? "Encrypted" : "Unencrypted"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Control bar */}
          <div className="flex justify-between items-center mt-4 p-2 bg-muted rounded-lg">
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMuted ? "Unmute" : "Mute"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isDeafened ? "destructive" : "outline"}
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={toggleDeafen}
                    >
                      {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isDeafened ? "Undeafen" : "Deafen"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSharing ? "default" : "outline"}
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={toggleScreenShare}
                    >
                      {isSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isSharing ? "Stop Sharing" : "Share Screen"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <VoiceEffects
                activeEffect={audioEffect}
                onEffectChange={changeAudioEffect}
                enabled={audioEffectEnabled}
                onToggle={toggleAudioEffect}
                intensity={effectIntensity}
                onIntensityChange={setEffectIntensity}
              />

              <RecordingControls
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                canRecord={Object.keys(recordingPermission).length > 0}
                onRequestPermission={requestRecordingPermission}
              />
            </div>

            <div className="flex items-center">
              <UserStatus
                user={user || { id: 0, username: "Guest" }}
                status={userStatus}
                onStatusChange={updateStatus}
              />
            </div>

            <div className="flex gap-1">
              <AdminControls
                isAdmin={isAdmin}
                participants={participants}
                onMuteParticipant={muteParticipant}
                onKickParticipant={kickParticipant}
                onMakeAdmin={makeAdmin}
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={() => setIsProfileOpen(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>More Options</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyInviteCode}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Friends
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={handleLeaveCall}
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Leave Call</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </main>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  )
}
