"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import SimplePeer from "simple-peer"

type ScreenPeer = {
  userId: number
  peer: SimplePeer.Instance
}

export function useScreenSharing(roomId: number, userId: number, token: string) {
  const [isSharing, setIsSharing] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<number | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket>()
  const screenPeersRef = useRef<ScreenPeer[]>([])

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
        },
        audio: false,
      })

      // Handle user stopping the screen share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }

      setScreenStream(stream)
      setIsSharing(true)
      setError(null)

      // Notify other users that we're sharing
      socketRef.current?.emit("screen-share-started", { roomId, userId })

      // Create peers for all users in the room
      socketRef.current?.emit("get-participants", { roomId }, (participants: number[]) => {
        participants.forEach((participantId) => {
          if (participantId !== userId) {
            const peer = new SimplePeer({
              initiator: true,
              stream,
              trickle: false,
              config: {
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }],
              },
            })

            peer.on("signal", (signal) => {
              socketRef.current?.emit("screen-signal", {
                userId: participantId,
                signal,
              })
            })

            screenPeersRef.current.push({ userId: participantId, peer })
          }
        })
      })

      return true
    } catch (err) {
      console.error("Error starting screen share:", err)
      setError(err instanceof Error ? err.message : "Failed to start screen sharing")
      setIsSharing(false)
      return false
    }
  }, [roomId, userId])

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop())
      setScreenStream(null)
    }

    // Destroy all peers
    screenPeersRef.current.forEach(({ peer }) => peer.destroy())
    screenPeersRef.current = []

    setIsSharing(false)

    // Notify other users that we've stopped sharing
    socketRef.current?.emit("screen-share-stopped", { roomId, userId })
  }, [roomId, userId, screenStream])

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      path: "/api/socket",
      auth: { token },
    })

    // Handle incoming screen share signals
    socketRef.current.on("screen-signal", ({ userId: senderId, signal }: { userId: number; signal: any }) => {
      const existingPeer = screenPeersRef.current.find((p) => p.userId === senderId)

      if (existingPeer) {
        existingPeer.peer.signal(signal)
      } else if (!isSharing) {
        // We're receiving a screen share
        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          config: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }],
          },
        })

        peer.on("signal", (signal) => {
          socketRef.current?.emit("screen-signal", {
            userId: senderId,
            signal,
          })
        })

        peer.on("stream", (stream) => {
          setScreenStream(stream)
          setViewingUserId(senderId)
        })

        peer.signal(signal)
        screenPeersRef.current.push({ userId: senderId, peer })
      }
    })

    // Handle user starting screen share
    socketRef.current.on("screen-share-started", ({ userId: sharingUserId }: { userId: number }) => {
      if (sharingUserId !== userId) {
        setViewingUserId(sharingUserId)
      }
    })

    // Handle user stopping screen share
    socketRef.current.on("screen-share-stopped", ({ userId: stoppedUserId }: { userId: number }) => {
      if (stoppedUserId === viewingUserId) {
        setViewingUserId(null)
        setScreenStream(null)

        // Clean up the peer
        const peerIndex = screenPeersRef.current.findIndex((p) => p.userId === stoppedUserId)
        if (peerIndex !== -1) {
          screenPeersRef.current[peerIndex].peer.destroy()
          screenPeersRef.current.splice(peerIndex, 1)
        }
      }
    })

    return () => {
      // Clean up
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop())
      }
      screenPeersRef.current.forEach(({ peer }) => peer.destroy())
      socketRef.current?.disconnect()
    }
  }, [roomId, userId, token, isSharing, viewingUserId])

  return {
    isSharing,
    startScreenShare,
    stopScreenShare,
    screenStream,
    viewingUserId,
    error,
  }
}
