"use client"

import { useEffect, useRef } from "react"

type Bubble = {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  hue: number
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubbles = useRef<Bubble[]>([])
  const animationFrameId = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Initialize bubbles
    const initBubbles = () => {
      bubbles.current = []
      const bubbleCount = Math.floor(window.innerWidth / 30) // Responsive bubble count

      for (let i = 0; i < bubbleCount; i++) {
        bubbles.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * 100,
          size: Math.random() * 15 + 5,
          speed: Math.random() * 0.7 + 0.3,
          opacity: Math.random() * 0.5 + 0.1,
          hue: Math.random() * 60 + 180, // Blue to cyan hues
        })
      }
    }

    // Draw a single bubble
    const drawBubble = (bubble: Bubble) => {
      if (!ctx) return

      ctx.save()

      // Create gradient for glossy effect
      const gradient = ctx.createRadialGradient(bubble.x, bubble.y, 0, bubble.x, bubble.y, bubble.size)

      gradient.addColorStop(0, `hsla(${bubble.hue}, 100%, 80%, ${bubble.opacity * 0.5})`)
      gradient.addColorStop(0.5, `hsla(${bubble.hue}, 100%, 60%, ${bubble.opacity * 0.3})`)
      gradient.addColorStop(1, `hsla(${bubble.hue}, 100%, 50%, ${bubble.opacity * 0.1})`)

      // Draw bubble
      ctx.beginPath()
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Add highlight for glossy effect
      ctx.beginPath()
      ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.8})`
      ctx.fill()

      ctx.restore()
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return

      // Clear canvas with a semi-transparent overlay to create trail effect
      ctx.fillStyle = "rgba(10, 20, 30, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw bubbles
      bubbles.current.forEach((bubble, index) => {
        // Move bubble upward
        bubble.y -= bubble.speed

        // Add slight horizontal movement
        bubble.x += Math.sin(bubble.y * 0.01) * 0.5

        // Reset bubble if it goes off screen
        if (bubble.y < -bubble.size * 2) {
          bubble.y = canvas.height + bubble.size
          bubble.x = Math.random() * canvas.width
        }

        drawBubble(bubble)
      })

      animationFrameId.current = requestAnimationFrame(animate)
    }

    // Set up canvas and start animation
    resizeCanvas()
    initBubbles()
    animate()

    // Handle window resize
    window.addEventListener("resize", () => {
      resizeCanvas()
      initBubbles()
    })

    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 bg-gradient-to-b from-blue-900/20 via-blue-800/10 to-blue-900/20"
    />
  )
}
