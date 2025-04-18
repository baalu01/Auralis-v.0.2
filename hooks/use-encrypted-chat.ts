"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import nacl from "tweetnacl"
import naclUtil from "tweetnacl-util"
import { encodeBase64, decodeBase64 } from "@/lib/encryption"

type Message = {
  id: number
  roomId: number
  userId: number
  username: string
  displayName?: string
  content: string
  createdAt: Date
  avatarUrl?: string
  encrypted?: boolean
  publicKey?: string
  reactions?: Record<string, number[]>
  files?: {
    id: number
    name: string
    url: string
    type: string
    size: number
  }[]
}

export function useEncryptedChat(roomId: number, userId: number, token: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [encryptionEnabled, setEncryptionEnabled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const socketRef = useRef<Socket>()
  const keyPairRef = useRef<nacl.BoxKeyPair>()
  const sharedKeysRef = useRef<Record<number, Uint8Array>>({})

  // Generate key pair for encryption
  useEffect(() => {
    keyPairRef.current = nacl.box.keyPair()
  }, [])

  // Connect to socket server and handle messages
  useEffect(() => {
    if (!token) return

    socketRef.current = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      path: "/api/socket",
      auth: { token },
    })

    socketRef.current.on("connect", () => {
      setIsConnected(true)
      socketRef.current?.emit("join-room", roomId)

      // Share public key with other users
      if (keyPairRef.current) {
        socketRef.current?.emit("public-key", {
          roomId,
          userId,
          publicKey: encodeBase64(keyPairRef.current.publicKey),
        })
      }
    })

    socketRef.current.on("disconnect", () => {
      setIsConnected(false)
    })

    socketRef.current.on("message", (message: Message) => {
      if (message.encrypted && message.userId !== userId && message.publicKey) {
        // Decrypt message if encryption is enabled
        try {
          const contentParts = message.content.split(":")
          if (contentParts.length !== 2) {
            console.error("Invalid encrypted message format")
            return
          }

          const nonce = decodeBase64(contentParts[0])
          const encryptedContent = decodeBase64(contentParts[1])

          if (!keyPairRef.current) {
            console.error("No key pair available")
            return
          }

          const decrypted = nacl.box.open(
            encryptedContent,
            nonce,
            decodeBase64(message.publicKey),
            keyPairRef.current.secretKey,
          )

          if (!decrypted) {
            console.error("Failed to decrypt message")
            return
          }

          message.content = naclUtil.encodeUTF8(decrypted)
          message.encrypted = false
        } catch (error) {
          console.error("Error decrypting message:", error)
          message.content = "[Encrypted message - cannot decrypt]"
        }
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id)
        if (exists) return prev
        return [...prev, message]
      })
    })

    socketRef.current.on("public-key", ({ userId, publicKey }: { userId: number; publicKey: string }) => {
      if (userId !== userId && keyPairRef.current) {
        const theirPublicKey = decodeBase64(publicKey)
        const sharedKey = nacl.box.before(theirPublicKey, keyPairRef.current.secretKey)
        sharedKeysRef.current[userId] = sharedKey
      }
    })

    socketRef.current.on(
      "reaction",
      ({ messageId, reaction, userId }: { messageId: number; reaction: string; userId: number }) => {
        setMessages((prev) => {
          return prev.map((message) => {
            if (message.id === messageId) {
              const reactions = message.reactions || {}
              const userIds = reactions[reaction] || []

              // Toggle reaction
              const updatedUserIds = userIds.includes(userId)
                ? userIds.filter((id) => id !== userId)
                : [...userIds, userId]

              return {
                ...message,
                reactions: {
                  ...reactions,
                  [reaction]: updatedUserIds,
                },
              }
            }
            return message
          })
        })
      },
    )

    return () => {
      socketRef.current?.disconnect()
    }
  }, [roomId, userId, token])

  // Load initial messages from API
  useEffect(() => {
    if (!roomId) return

    fetch(`/api/rooms/${roomId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || [])
      })
      .catch((err) => {
        console.error("Error loading messages:", err)
      })
  }, [roomId])

  const sendMessage = useCallback(
    (content: string, files?: File[]) => {
      if (!socketRef.current || !isConnected || !roomId) return

      const message: Partial<Message> = {
        roomId,
        userId,
        content,
        createdAt: new Date(),
        encrypted: encryptionEnabled,
      }

      // Handle file uploads if any
      if (files && files.length > 0) {
        const formData = new FormData()
        files.forEach((file) => {
          formData.append("files", file)
        })
        formData.append("roomId", roomId.toString())

        fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            message.files = data.files

            // Encrypt message if enabled
            if (encryptionEnabled && keyPairRef.current) {
              // For each recipient, encrypt with their public key
              Object.keys(sharedKeysRef.current).forEach((recipientId) => {
                const nonce = nacl.randomBytes(nacl.box.nonceLength)
                const encrypted = nacl.box(
                  naclUtil.decodeUTF8(content),
                  nonce,
                  decodeBase64(recipientId),
                  keyPairRef.current!.secretKey,
                )

                const encryptedMessage = {
                  ...message,
                  content: `${encodeBase64(nonce)}:${encodeBase64(encrypted)}`,
                  publicKey: encodeBase64(keyPairRef.current.publicKey),
                }

                socketRef.current?.emit("message", { roomId, message: encryptedMessage })
              })
            } else {
              socketRef.current?.emit("message", { roomId, message })
            }
          })
          .catch((err) => {
            console.error("Error uploading files:", err)
            // Send message without files if upload fails
            socketRef.current?.emit("message", { roomId, message })
          })
      } else {
        // No files, just send the message

        // Encrypt message if enabled
        if (encryptionEnabled && keyPairRef.current) {
          // For demonstration, we'll use a simplified approach
          // In a real app, you'd encrypt for each recipient
          const nonce = nacl.randomBytes(nacl.box.nonceLength)
          const encrypted = nacl.secretbox(
            naclUtil.decodeUTF8(content),
            nonce,
            keyPairRef.current.secretKey.slice(0, nacl.secretbox.keyLength),
          )

          message.content = `${encodeBase64(nonce)}:${encodeBase64(encrypted)}`
          message.publicKey = encodeBase64(keyPairRef.current.publicKey)
        }

        socketRef.current?.emit("message", { roomId, message })
      }
    },
    [roomId, userId, encryptionEnabled, isConnected],
  )

  const toggleEncryption = useCallback(() => {
    setEncryptionEnabled(!encryptionEnabled)
  }, [encryptionEnabled])

  const addReaction = useCallback(
    (messageId: number, reaction: string) => {
      if (!socketRef.current || !isConnected) return
      socketRef.current.emit("reaction", { roomId, messageId, reaction })
    },
    [roomId, isConnected],
  )

  return {
    messages,
    sendMessage,
    encryptionEnabled,
    toggleEncryption,
    addReaction,
    isConnected,
  }
}
