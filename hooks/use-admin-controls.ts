"use client"

import { useState, useEffect, useCallback } from "react"

type Participant = {
  id: number
  username: string
  displayName?: string
  avatarUrl?: string
  isMuted?: boolean
  isAdmin?: boolean
}

export function useAdminControls(roomId: number, userId: number) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load room participants and check admin status
  useEffect(() => {
    setLoading(true)

    Promise.all([
      fetch(`/api/rooms/${roomId}/participants`).then((res) => res.json()),
      fetch(`/api/rooms/${roomId}/admin`).then((res) => res.json()),
    ])
      .then(([participantsData, adminData]) => {
        setParticipants(participantsData.participants || [])
        setIsAdmin(adminData.isAdmin || false)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading admin data:", err)
        setLoading(false)
      })
  }, [roomId, userId])

  const muteParticipant = useCallback(
    (participantId: number) => {
      if (!isAdmin) return

      fetch(`/api/rooms/${roomId}/participants/${participantId}/mute`, {
        method: "POST",
      })
        .then(() => {
          setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, isMuted: true } : p)))
        })
        .catch((err) => {
          console.error("Error muting participant:", err)
        })
    },
    [roomId, isAdmin],
  )

  const kickParticipant = useCallback(
    (participantId: number) => {
      if (!isAdmin) return

      fetch(`/api/rooms/${roomId}/participants/${participantId}/kick`, {
        method: "POST",
      })
        .then(() => {
          setParticipants((prev) => prev.filter((p) => p.id !== participantId))
        })
        .catch((err) => {
          console.error("Error kicking participant:", err)
        })
    },
    [roomId, isAdmin],
  )

  const makeAdmin = useCallback(
    (participantId: number) => {
      if (!isAdmin) return

      fetch(`/api/rooms/${roomId}/participants/${participantId}/admin`, {
        method: "POST",
      })
        .then(() => {
          setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, isAdmin: true } : p)))
        })
        .catch((err) => {
          console.error("Error making participant admin:", err)
        })
    },
    [roomId, isAdmin],
  )

  return {
    participants,
    isAdmin,
    loading,
    muteParticipant,
    kickParticipant,
    makeAdmin,
  }
}
