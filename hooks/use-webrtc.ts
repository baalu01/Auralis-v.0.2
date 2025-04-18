"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import SimplePeer from "simple-peer"

type Peer = {
  userId: number
  peer: SimplePeer.Instance
}

export function useWebRTC(roomId: number, userId: number, token: string) {
  const [peers, setPeers] = useState<Peer[]>([])
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioEffectEnabled, setAudioEffectEnabled] = useState(false)
  const [audioEffect, setAudioEffect] = useState<string>("none")
  const [effectIntensity, setEffectIntensity] = useState<number>(50)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingPermission, setRecordingPermission] = useState<Record<number, boolean>>({})

  const socketRef = useRef<Socket>()
  const userStreamRef = useRef<MediaStream>()
  const peersRef = useRef<Peer[]>([])
  const audioContextRef = useRef<AudioContext>()
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode>()
  const destinationRef = useRef<MediaStreamAudioDestinationNode>()
  const effectNodeRef = useRef<any>()
  const mediaRecorderRef = useRef<MediaRecorder>()
  const recordedChunksRef = useRef<Blob[]>([])

  const createPeer = useCallback((targetUserId: number, initiator: boolean) => {
    const peer = new SimplePeer({
      initiator,
      stream: destinationRef.current?.stream || userStreamRef.current,
      trickle: false,
      config: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }],
      },
    })

    peer.on("signal", (signal) => {
      socketRef.current?.emit("signal", { userId: targetUserId, signal })
    })

    return { userId: targetUserId, peer }
  }, [])

  const addPeer = useCallback((incomingSignal: any, callerUserId: number) => {
    const peer = new SimplePeer({
      initiator: false,
      stream: destinationRef.current?.stream || userStreamRef.current,
      trickle: false,
      config: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }],
      },
    })

    peer.on("signal", (signal) => {
      socketRef.current?.emit("signal", { userId: callerUserId, signal })
    })

    peer.signal(incomingSignal)

    return { userId: callerUserId, peer }
  }, [])

  const setupAudioEffects = useCallback(() => {
    if (!userStreamRef.current) return

    audioContextRef.current = new AudioContext()
    sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(userStreamRef.current)
    destinationRef.current = audioContextRef.current.createMediaStreamDestination()

    // Connect source directly to destination initially
    sourceNodeRef.current.connect(destinationRef.current)
  }, [])

  const applyAudioEffect = useCallback((effect: string, intensity = 50) => {
    if (!audioContextRef.current || !sourceNodeRef.current || !destinationRef.current) return

    // Normalize intensity to 0-1 range
    const normalizedIntensity = intensity / 100

    // Disconnect previous effect if any
    if (effectNodeRef.current) {
      sourceNodeRef.current.disconnect()
      if (Array.isArray(effectNodeRef.current)) {
        effectNodeRef.current.forEach((node: any) => {
          if (node.disconnect) node.disconnect()
        })
      } else if (effectNodeRef.current.disconnect) {
        effectNodeRef.current.disconnect()
      }
      effectNodeRef.current = null
    } else {
      sourceNodeRef.current.disconnect()
    }

    // Apply new effect
    switch (effect) {
      case "robot": {
        // Create a modulator oscillator
        const oscillator = audioContextRef.current.createOscillator()
        const oscillatorGain = audioContextRef.current.createGain()
        const modulationFrequency = 50 + normalizedIntensity * 150 // 50-200Hz range

        oscillator.frequency.value = modulationFrequency
        oscillatorGain.gain.value = 0.1 + normalizedIntensity * 0.4 // 0.1-0.5 range

        // Create a carrier (your voice)
        const carrierGain = audioContextRef.current.createGain()

        // Connect modulator
        oscillator.connect(oscillatorGain)
        oscillatorGain.connect(carrierGain.gain)

        // Connect carrier
        sourceNodeRef.current.connect(carrierGain)
        carrierGain.connect(destinationRef.current)

        // Start oscillator
        oscillator.start()

        effectNodeRef.current = [oscillator, oscillatorGain, carrierGain]
        break
      }

      case "echo": {
        const delay = audioContextRef.current.createDelay(1.0)
        const feedback = audioContextRef.current.createGain()
        const delayTime = 0.1 + normalizedIntensity * 0.4 // 0.1-0.5 seconds
        const feedbackGain = 0.1 + normalizedIntensity * 0.6 // 0.1-0.7 range

        delay.delayTime.value = delayTime
        feedback.gain.value = feedbackGain

        sourceNodeRef.current.connect(destinationRef.current) // Direct path
        sourceNodeRef.current.connect(delay)
        delay.connect(feedback)
        feedback.connect(delay)
        delay.connect(destinationRef.current)

        effectNodeRef.current = [delay, feedback]
        break
      }

      case "pitch": {
        // Simple pitch shift using a BiquadFilter
        const pitchShift = audioContextRef.current.createBiquadFilter()
        pitchShift.type = "allpass"

        // Map intensity to frequency range
        // Lower values for higher pitch, higher values for lower pitch
        const frequency =
          normalizedIntensity < 0.5
            ? 2000 - normalizedIntensity * 2 * 1800 // Higher pitch (200-2000Hz)
            : 200 - (normalizedIntensity - 0.5) * 2 * 150 // Lower pitch (50-200Hz)

        pitchShift.frequency.value = frequency
        pitchShift.Q.value = 10

        sourceNodeRef.current.connect(pitchShift)
        pitchShift.connect(destinationRef.current)

        effectNodeRef.current = pitchShift
        break
      }

      case "reverb": {
        // Create a convolver node for reverb
        const convolver = audioContextRef.current.createConvolver()
        const reverbGain = audioContextRef.current.createGain()
        reverbGain.gain.value = normalizedIntensity

        // Create an impulse response (simplified)
        const sampleRate = audioContextRef.current.sampleRate
        const length = sampleRate * (0.5 + normalizedIntensity) // 0.5-1.5 seconds
        const impulse = audioContextRef.current.createBuffer(2, length, sampleRate)

        for (let channel = 0; channel < 2; channel++) {
          const impulseData = impulse.getChannelData(channel)
          for (let i = 0; i < length; i++) {
            impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
          }
        }

        convolver.buffer = impulse

        // Direct path with reduced gain
        const directGain = audioContextRef.current.createGain()
        directGain.gain.value = 1 - normalizedIntensity * 0.5

        sourceNodeRef.current.connect(directGain)
        directGain.connect(destinationRef.current)

        // Reverb path
        sourceNodeRef.current.connect(convolver)
        convolver.connect(reverbGain)
        reverbGain.connect(destinationRef.current)

        effectNodeRef.current = [convolver, reverbGain, directGain]
        break
      }

      case "distortion": {
        // Create a waveshaper for distortion
        const distortion = audioContextRef.current.createWaveShaper()
        const distortionGain = audioContextRef.current.createGain()
        distortionGain.gain.value = normalizedIntensity

        // Create distortion curve
        const samples = 44100
        const curve = new Float32Array(samples)
        const amount = 5 + normalizedIntensity * 45 // 5-50 range

        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1
          curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x))
        }

        distortion.curve = curve
        distortion.oversample = "4x"

        // Direct path with reduced gain
        const directGain = audioContextRef.current.createGain()
        directGain.gain.value = 1 - normalizedIntensity * 0.8

        sourceNodeRef.current.connect(directGain)
        directGain.connect(destinationRef.current)

        // Distortion path
        sourceNodeRef.current.connect(distortion)
        distortion.connect(distortionGain)
        distortionGain.connect(destinationRef.current)

        effectNodeRef.current = [distortion, distortionGain, directGain]
        break
      }

      case "telephone": {
        // Create bandpass filter to simulate telephone
        const bandpass = audioContextRef.current.createBiquadFilter()
        bandpass.type = "bandpass"
        bandpass.frequency.value = 1500
        bandpass.Q.value = 0.5

        // Add some distortion
        const distortion = audioContextRef.current.createWaveShaper()
        const curve = new Float32Array(44100)
        for (let i = 0; i < 44100; i++) {
          const x = (i * 2) / 44100 - 1
          curve[i] = (1.5 * x) / (1 + Math.abs(x))
        }
        distortion.curve = curve

        sourceNodeRef.current.connect(bandpass)
        bandpass.connect(distortion)
        distortion.connect(destinationRef.current)

        effectNodeRef.current = [bandpass, distortion]
        break
      }

      case "underwater": {
        // Create lowpass filter
        const lowpass = audioContextRef.current.createBiquadFilter()
        lowpass.type = "lowpass"
        lowpass.frequency.value = 400 + normalizedIntensity * 400 // 400-800Hz

        // Create modulation for "bubbling" effect
        const oscillator = audioContextRef.current.createOscillator()
        const oscillatorGain = audioContextRef.current.createGain()
        oscillator.frequency.value = 1 + normalizedIntensity * 4 // 1-5Hz
        oscillatorGain.gain.value = 100 + normalizedIntensity * 200 // 100-300 range

        // Connect modulation to filter frequency
        oscillator.connect(oscillatorGain)
        oscillatorGain.connect(lowpass.frequency)

        // Connect audio through filter
        sourceNodeRef.current.connect(lowpass)
        lowpass.connect(destinationRef.current)

        // Start oscillator
        oscillator.start()

        effectNodeRef.current = [lowpass, oscillator, oscillatorGain]
        break
      }

      case "alien": {
        // Create ring modulator effect
        const oscillator = audioContextRef.current.createOscillator()
        const oscillatorGain = audioContextRef.current.createGain()
        const ringGain = audioContextRef.current.createGain()

        oscillator.frequency.value = 50 + normalizedIntensity * 450 // 50-500Hz
        oscillatorGain.gain.value = 1.0

        // Create a delay for added weirdness
        const delay = audioContextRef.current.createDelay(0.5)
        delay.delayTime.value = 0.1 + normalizedIntensity * 0.2 // 0.1-0.3 seconds

        // Connect oscillator to gain
        oscillator.connect(oscillatorGain)

        // Connect source to ring gain
        sourceNodeRef.current.connect(ringGain)

        // Connect oscillator gain to ring gain's gain parameter
        oscillatorGain.connect(ringGain.gain)

        // Connect ring gain to delay and destination
        ringGain.connect(delay)
        delay.connect(destinationRef.current)

        // Also connect direct path with phase inversion
        const inverter = audioContextRef.current.createGain()
        inverter.gain.value = -0.5 * normalizedIntensity
        sourceNodeRef.current.connect(inverter)
        inverter.connect(destinationRef.current)

        // Start oscillator
        oscillator.start()

        effectNodeRef.current = [oscillator, oscillatorGain, ringGain, delay, inverter]
        break
      }

      default:
        // No effect, connect source directly to destination
        sourceNodeRef.current.connect(destinationRef.current)
        break
    }

    // Update all peers with the new stream
    peersRef.current.forEach(({ peer }) => {
      peer.removeStream(userStreamRef.current!)
      peer.addStream(destinationRef.current!.stream)
    })

    return () => {
      if (effectNodeRef.current) {
        if (Array.isArray(effectNodeRef.current)) {
          effectNodeRef.current.forEach((node: any) => {
            if (node.stop) node.stop()
          })
        } else if (effectNodeRef.current.stop) {
          effectNodeRef.current.stop()
        }
        sourceNodeRef.current?.disconnect()
        if (Array.isArray(effectNodeRef.current)) {
          effectNodeRef.current.forEach((node: any) => {
            if (node.disconnect) node.disconnect()
          })
        } else if (effectNodeRef.current.disconnect) {
          effectNodeRef.current.disconnect()
        }
      }
    }
  }, [])

  const toggleAudio = useCallback(() => {
    if (userStreamRef.current) {
      userStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled
      })
      setAudioEnabled(!audioEnabled)
    }
  }, [audioEnabled])

  const toggleAudioEffect = useCallback(() => {
    if (audioEffectEnabled) {
      applyAudioEffect("none")
    } else {
      applyAudioEffect(audioEffect, effectIntensity)
    }
    setAudioEffectEnabled(!audioEffectEnabled)
  }, [audioEffectEnabled, audioEffect, applyAudioEffect, effectIntensity])

  const changeAudioEffect = useCallback(
    (effect: string, intensity?: number) => {
      setAudioEffect(effect)
      if (intensity !== undefined) {
        setEffectIntensity(intensity)
      }
      if (audioEffectEnabled) {
        applyAudioEffect(effect, intensity !== undefined ? intensity : effectIntensity)
      }
    },
    [audioEffectEnabled, applyAudioEffect, effectIntensity],
  )

  const startRecording = useCallback(() => {
    if (!destinationRef.current?.stream) return

    recordedChunksRef.current = []
    const options = { mimeType: "audio/webm" }

    try {
      mediaRecorderRef.current = new MediaRecorder(destinationRef.current.stream, options)
    } catch (e) {
      console.error("MediaRecorder error:", e)
      return
    }

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data)
      }
    }

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `recording-${new Date().toISOString()}.webm`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)
    }

    mediaRecorderRef.current.start()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  const requestRecordingPermission = useCallback(() => {
    socketRef.current?.emit("request-recording", { roomId })
  }, [roomId])

  const grantRecordingPermission = useCallback(
    (targetUserId: number) => {
      socketRef.current?.emit("grant-recording", { roomId, userId: targetUserId })
      setRecordingPermission((prev) => ({ ...prev, [targetUserId]: true }))
    },
    [roomId],
  )

  useEffect(() => {
    // Get user's audio stream
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        userStreamRef.current = stream
        setupAudioEffects()

        // Connect to socket server
        socketRef.current = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
          path: "/api/socket",
          auth: { token },
        })

        // Join room
        socketRef.current.emit("join-room", roomId)

        // Handle new user connection
        socketRef.current.on("user-connected", (userData: { userId: number }) => {
          const peerObj = createPeer(userData.userId, true)
          peersRef.current.push(peerObj)
          setPeers((prev) => [...prev, peerObj])
        })

        // Handle incoming signal
        socketRef.current.on("signal", ({ userId, signal }: { userId: number; signal: any }) => {
          const existingPeer = peersRef.current.find((p) => p.userId === userId)

          if (existingPeer) {
            existingPeer.peer.signal(signal)
          } else {
            const peerObj = addPeer(signal, userId)
            peersRef.current.push(peerObj)
            setPeers((prev) => [...prev, peerObj])
          }
        })

        // Handle user disconnect
        socketRef.current.on("user-disconnected", (userId: number) => {
          const peerObj = peersRef.current.find((p) => p.userId === userId)
          if (peerObj) {
            peerObj.peer.destroy()
          }
          peersRef.current = peersRef.current.filter((p) => p.userId !== userId)
          setPeers((prev) => prev.filter((p) => p.userId !== userId))
        })

        // Handle recording permission requests
        socketRef.current.on("recording-requested", ({ userId }: { userId: number }) => {
          // Show UI to accept/deny recording permission
          // For now, we'll auto-accept
          socketRef.current?.emit("grant-recording", { roomId, userId })
        })

        // Handle recording permission grants
        socketRef.current.on("recording-permission-granted", ({ userId }: { userId: number }) => {
          setRecordingPermission((prev) => ({ ...prev, [userId]: true }))
        })

        return () => {
          // Clean up
          userStreamRef.current?.getTracks().forEach((track) => track.stop())
          peersRef.current.forEach(({ peer }) => peer.destroy())
          socketRef.current?.disconnect()

          if (audioContextRef.current?.state !== "closed") {
            audioContextRef.current?.close()
          }
        }
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err)
      })
  }, [roomId, token, createPeer, addPeer, setupAudioEffects])

  return {
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
  }
}
