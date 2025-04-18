"use client"

import { useEffect, useRef, useState } from "react"

type Fish = {
  x: number
  y: number
  size: number
  speed: number
  color: string
  direction: number // 1 for right, -1 for left
  ySpeed: number
  type: "clownfish" | "angelfish" | "bluefish" | "jellyfish"
  tailSpeed: number
  tailAngle: number
  bubbleTime: number
}

type Bubble = {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

type Plant = {
  x: number
  y: number
  height: number
  width: number
  color: string
  swaySpeed: number
  swayAmount: number
  swayOffset: number
  segments: number
}

type CoralReef = {
  x: number
  y: number
  size: number
  color: string
  type: "branch" | "brain" | "fan"
  segments: number[]
}

export function AquariumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const fishRef = useRef<Fish[]>([])
  const bubblesRef = useRef<Bubble[]>([])
  const plantsRef = useRef<Plant[]>([])
  const coralRef = useRef<CoralReef[]>([])
  const animationFrameId = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // Initialize the aquarium elements
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect()
        setDimensions({ width, height })
        canvasRef.current.width = width
        canvasRef.current.height = height
        initializeElements(width, height)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  const initializeElements = (width: number, height: number) => {
    // Initialize fish
    const fishCount = Math.max(5, Math.floor(width / 200))
    const fish: Fish[] = []

    const fishTypes: ("clownfish" | "angelfish" | "bluefish" | "jellyfish")[] = [
      "clownfish",
      "angelfish",
      "bluefish",
      "jellyfish",
    ]

    for (let i = 0; i < fishCount; i++) {
      fish.push({
        x: Math.random() * width,
        y: 100 + Math.random() * (height - 200),
        size: 15 + Math.random() * 25,
        speed: 0.5 + Math.random() * 2,
        color: getRandomFishColor(),
        direction: Math.random() > 0.5 ? 1 : -1,
        ySpeed: (Math.random() - 0.5) * 0.5,
        type: fishTypes[Math.floor(Math.random() * fishTypes.length)],
        tailSpeed: 0.05 + Math.random() * 0.1,
        tailAngle: 0,
        bubbleTime: Math.random() * 5000,
      })
    }
    fishRef.current = fish

    // Initialize bubbles
    const bubbleCount = Math.max(15, Math.floor(width / 100))
    const bubbles: Bubble[] = []

    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: height + Math.random() * 100,
        size: 2 + Math.random() * 8,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.2 + Math.random() * 0.6,
      })
    }
    bubblesRef.current = bubbles

    // Initialize plants
    const plantCount = Math.max(5, Math.floor(width / 300))
    const plants: Plant[] = []

    for (let i = 0; i < plantCount; i++) {
      plants.push({
        x: Math.random() * width,
        y: height,
        height: 50 + Math.random() * 150,
        width: 20 + Math.random() * 40,
        color: getRandomPlantColor(),
        swaySpeed: 0.001 + Math.random() * 0.003,
        swayAmount: 10 + Math.random() * 20,
        swayOffset: Math.random() * Math.PI * 2,
        segments: 5 + Math.floor(Math.random() * 5),
      })
    }
    plantsRef.current = plants

    // Initialize coral reefs
    const coralCount = Math.max(3, Math.floor(width / 400))
    const corals: CoralReef[] = []
    const coralTypes: ("branch" | "brain" | "fan")[] = ["branch", "brain", "fan"]

    for (let i = 0; i < coralCount; i++) {
      const segments = []
      const segmentCount = 3 + Math.floor(Math.random() * 5)
      for (let j = 0; j < segmentCount; j++) {
        segments.push(Math.random() * 360)
      }

      corals.push({
        x: Math.random() * width,
        y: height - 10 - Math.random() * 50,
        size: 30 + Math.random() * 50,
        color: getRandomCoralColor(),
        type: coralTypes[Math.floor(Math.random() * coralTypes.length)],
        segments,
      })
    }
    coralRef.current = corals
  }

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const animate = (time: number) => {
      if (!canvasRef.current) return

      // Calculate delta time for smooth animations
      const deltaTime = time - (lastTimeRef.current || time)
      lastTimeRef.current = time

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
      gradient.addColorStop(0, "rgba(10, 40, 80, 0.8)")
      gradient.addColorStop(1, "rgba(5, 20, 50, 0.9)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Draw light rays
      drawLightRays(ctx, dimensions.width, dimensions.height, time)

      // Draw coral reefs
      coralRef.current.forEach((coral) => {
        drawCoral(ctx, coral, time)
      })

      // Draw plants
      plantsRef.current.forEach((plant) => {
        drawPlant(ctx, plant, time)
      })

      // Draw sand at the bottom
      drawSand(ctx, dimensions.width, dimensions.height)

      // Update and draw bubbles
      bubblesRef.current.forEach((bubble, index) => {
        // Move bubble upward
        bubble.y -= bubble.speed * (deltaTime / 16)

        // Reset bubble if it goes off screen
        if (bubble.y < -bubble.size * 2) {
          bubble.y = dimensions.height + Math.random() * 100
          bubble.x = Math.random() * dimensions.width
        }

        // Add slight horizontal movement
        bubble.x += Math.sin(time * 0.001 + index) * 0.3

        // Draw bubble
        drawBubble(ctx, bubble)
      })

      // Update and draw fish
      fishRef.current.forEach((fish, index) => {
        // Move fish
        fish.x += fish.speed * fish.direction * (deltaTime / 16)
        fish.y += fish.ySpeed * (deltaTime / 16)

        // Bounce off walls
        if (fish.x > dimensions.width + fish.size) {
          fish.direction = -1
        } else if (fish.x < -fish.size) {
          fish.direction = 1
        }

        // Bounce off top and bottom with some margin
        if (fish.y < fish.size) {
          fish.ySpeed = Math.abs(fish.ySpeed)
        } else if (fish.y > dimensions.height - fish.size * 2) {
          fish.ySpeed = -Math.abs(fish.ySpeed)
        }

        // Occasionally change vertical direction
        if (Math.random() < 0.01) {
          fish.ySpeed = (Math.random() - 0.5) * 0.5
        }

        // Update tail animation
        fish.tailAngle = Math.sin(time * fish.tailSpeed) * 0.3

        // Create bubbles occasionally
        fish.bubbleTime -= deltaTime
        if (fish.bubbleTime <= 0) {
          bubblesRef.current.push({
            x: fish.x + (fish.direction === 1 ? -fish.size / 2 : fish.size / 2),
            y: fish.y,
            size: 2 + Math.random() * 4,
            speed: 0.5 + Math.random() * 1,
            opacity: 0.2 + Math.random() * 0.4,
          })
          fish.bubbleTime = 3000 + Math.random() * 7000
        }

        // Draw fish
        drawFish(ctx, fish)
      })

      // Add subtle water caustics effect
      drawCaustics(ctx, dimensions.width, dimensions.height, time)

      animationFrameId.current = requestAnimationFrame(animate)
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [dimensions])

  // Drawing functions
  const drawFish = (ctx: CanvasRenderingContext2D, fish: Fish) => {
    ctx.save()
    ctx.translate(fish.x, fish.y)
    ctx.scale(fish.direction, 1)

    switch (fish.type) {
      case "clownfish":
        drawClownfish(ctx, fish)
        break
      case "angelfish":
        drawAngelfish(ctx, fish)
        break
      case "bluefish":
        drawBlueFish(ctx, fish)
        break
      case "jellyfish":
        drawJellyfish(ctx, fish)
        break
    }

    ctx.restore()
  }

  const drawClownfish = (ctx: CanvasRenderingContext2D, fish: Fish) => {
    const bodyLength = fish.size * 1.5
    const bodyHeight = fish.size

    // Body
    ctx.fillStyle = fish.color
    ctx.beginPath()
    ctx.ellipse(0, 0, bodyLength / 2, bodyHeight / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Stripes
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.ellipse(-bodyLength / 6, 0, bodyLength / 12, bodyHeight / 2.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(bodyLength / 6, 0, bodyLength / 12, bodyHeight / 2.2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Tail
    ctx.fillStyle = fish.color
    ctx.beginPath()
    ctx.moveTo(-bodyLength / 2, 0)
    ctx.quadraticCurveTo(
      -bodyLength / 2 - bodyLength / 3,
      bodyHeight / 2 + Math.sin(fish.tailAngle) * bodyHeight,
      -bodyLength / 2 - bodyLength / 2,
      0,
    )
    ctx.quadraticCurveTo(
      -bodyLength / 2 - bodyLength / 3,
      -bodyHeight / 2 - Math.sin(fish.tailAngle) * bodyHeight,
      -bodyLength / 2,
      0,
    )
    ctx.fill()

    // Fins
    ctx.fillStyle = fish.color
    // Top fin
    ctx.beginPath()
    ctx.moveTo(0, -bodyHeight / 2)
    ctx.quadraticCurveTo(bodyLength / 4, -bodyHeight, -bodyLength / 4, -bodyHeight)
    ctx.fill()
    // Bottom fin
    ctx.beginPath()
    ctx.moveTo(0, bodyHeight / 2)
    ctx.quadraticCurveTo(bodyLength / 4, bodyHeight, -bodyLength / 4, bodyHeight)
    ctx.fill()

    // Eye
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(bodyLength / 3, -bodyHeight / 6, bodyHeight / 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "black"
    ctx.beginPath()
    ctx.arc(bodyLength / 3, -bodyHeight / 6, bodyHeight / 16, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawAngelfish = (ctx: CanvasRenderingContext2D, fish: Fish) => {
    const bodySize = fish.size

    // Body
    ctx.fillStyle = fish.color
    ctx.beginPath()
    ctx.ellipse(0, 0, bodySize / 2, bodySize, 0, 0, Math.PI * 2)
    ctx.fill()

    // Fins
    // Top fin
    ctx.beginPath()
    ctx.moveTo(0, -bodySize)
    ctx.quadraticCurveTo(bodySize / 2, -bodySize * 2, -bodySize / 2, -bodySize * 2)
    ctx.quadraticCurveTo(-bodySize, -bodySize * 1.5, 0, -bodySize)
    ctx.fill()

    // Bottom fin
    ctx.beginPath()
    ctx.moveTo(0, bodySize)
    ctx.quadraticCurveTo(bodySize / 2, bodySize * 2, -bodySize / 2, bodySize * 2)
    ctx.quadraticCurveTo(-bodySize, bodySize * 1.5, 0, bodySize)
    ctx.fill()

    // Tail
    ctx.beginPath()
    ctx.moveTo(-bodySize / 2, 0)
    ctx.quadraticCurveTo(
      -bodySize - bodySize / 2,
      bodySize + Math.sin(fish.tailAngle) * bodySize,
      -bodySize - bodySize / 2,
      0,
    )
    ctx.quadraticCurveTo(-bodySize - bodySize / 2, -bodySize - Math.sin(fish.tailAngle) * bodySize, -bodySize / 2, 0)
    ctx.fill()

    // Stripes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
    ctx.lineWidth = bodySize / 10
    ctx.beginPath()
    ctx.moveTo(0, -bodySize / 2)
    ctx.lineTo(0, bodySize / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-bodySize / 4, -bodySize / 1.5)
    ctx.lineTo(-bodySize / 4, bodySize / 1.5)
    ctx.stroke()

    // Eye
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(bodySize / 3, 0, bodySize / 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "black"
    ctx.beginPath()
    ctx.arc(bodySize / 3, 0, bodySize / 12, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawBlueFish = (ctx: CanvasRenderingContext2D, fish: Fish) => {
    const bodyLength = fish.size * 1.8
    const bodyHeight = fish.size * 0.8

    // Body
    const gradient = ctx.createLinearGradient(bodyLength / 2, -bodyHeight / 2, bodyLength / 2, bodyHeight / 2)
    gradient.addColorStop(0, "rgba(30, 144, 255, 0.9)")
    gradient.addColorStop(0.5, "rgba(70, 130, 180, 0.9)")
    gradient.addColorStop(1, "rgba(30, 144, 255, 0.9)")
    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.moveTo(bodyLength / 2, 0)
    ctx.quadraticCurveTo(bodyLength / 4, -bodyHeight / 2, -bodyLength / 2, -bodyHeight / 4)
    ctx.quadraticCurveTo(-bodyLength / 2 - bodyLength / 4, 0, -bodyLength / 2, bodyHeight / 4)
    ctx.quadraticCurveTo(bodyLength / 4, bodyHeight / 2, bodyLength / 2, 0)
    ctx.fill()

    // Tail
    ctx.beginPath()
    ctx.moveTo(-bodyLength / 2, -bodyHeight / 4)
    ctx.quadraticCurveTo(-bodyLength, -bodyHeight / 2 - (Math.sin(fish.tailAngle) * bodyHeight) / 2, -bodyLength, 0)
    ctx.quadraticCurveTo(
      -bodyLength,
      bodyHeight / 2 + (Math.sin(fish.tailAngle) * bodyHeight) / 2,
      -bodyLength / 2,
      bodyHeight / 4,
    )
    ctx.fill()

    // Dorsal fin
    ctx.beginPath()
    ctx.moveTo(0, -bodyHeight / 2)
    ctx.quadraticCurveTo(-bodyLength / 4, -bodyHeight, -bodyLength / 2, -bodyHeight / 4)
    ctx.fill()

    // Ventral fin
    ctx.beginPath()
    ctx.moveTo(0, bodyHeight / 2)
    ctx.quadraticCurveTo(-bodyLength / 4, bodyHeight, -bodyLength / 2, bodyHeight / 4)
    ctx.fill()

    // Pectoral fin
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-bodyLength / 8, bodyHeight / 2, 0, bodyHeight / 2)
    ctx.fill()

    // Eye
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(bodyLength / 4, -bodyHeight / 8, bodyHeight / 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "black"
    ctx.beginPath()
    ctx.arc(bodyLength / 4, -bodyHeight / 8, bodyHeight / 16, 0, Math.PI * 2)
    ctx.fill()

    // Gills
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, bodyLength / 8, Math.PI / 2, -Math.PI / 2, true)
    ctx.stroke()
  }

  const drawJellyfish = (ctx: CanvasRenderingContext2D, fish: Fish) => {
    const size = fish.size
    const time = Date.now() * 0.001

    // Bell
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
    gradient.addColorStop(0, "rgba(180, 180, 255, 0.8)")
    gradient.addColorStop(1, "rgba(100, 100, 200, 0.4)")
    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.arc(0, 0, size, 0, Math.PI, false)
    ctx.quadraticCurveTo(size * 0.8, size * 0.5, size * 0.5, size * 0.8)
    ctx.quadraticCurveTo(0, size * 1.2, -size * 0.5, size * 0.8)
    ctx.quadraticCurveTo(-size * 0.8, size * 0.5, -size, 0)
    ctx.fill()

    // Tentacles
    ctx.strokeStyle = "rgba(180, 180, 255, 0.6)"
    const tentacleCount = 8
    const tentacleLength = size * 2

    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI
      const xStart = Math.cos(angle) * size * 0.5
      const yStart = Math.sin(angle) * size * 0.8 + size * 0.2

      ctx.beginPath()
      ctx.moveTo(xStart, yStart)

      let x = xStart
      let y = yStart
      const segments = 10
      const waveFrequency = 3 + (i % 3)
      const waveAmplitude = size * 0.1

      for (let j = 1; j <= segments; j++) {
        const t = j / segments
        const waveOffset = Math.sin(time * 2 + i) * 0.2
        const waveX = Math.sin((t * waveFrequency + time + i) * 2) * waveAmplitude
        x = xStart + waveX
        y = yStart + t * tentacleLength * (0.7 + waveOffset)
        ctx.lineTo(x, y)
      }

      ctx.lineWidth = 1 + Math.random() * 2
      ctx.stroke()
    }

    // Inner glow
    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.7)
    innerGlow.addColorStop(0, "rgba(255, 255, 255, 0.5)")
    innerGlow.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = innerGlow
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawBubble = (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
    ctx.save()
    ctx.globalAlpha = bubble.opacity

    // Main bubble
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(bubble.x, bubble.y, 0, bubble.x, bubble.y, bubble.size)
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)")
    gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.1)")
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.05)")
    ctx.fillStyle = gradient
    ctx.fill()

    // Highlight
    ctx.beginPath()
    ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fill()

    ctx.restore()
  }

  const drawPlant = (ctx: CanvasRenderingContext2D, plant: Plant, time: number) => {
    const segmentHeight = plant.height / plant.segments
    let currentX = plant.x
    let currentY = plant.y

    ctx.strokeStyle = plant.color
    ctx.lineWidth = plant.width / 5
    ctx.lineCap = "round"

    for (let i = 0; i < plant.segments; i++) {
      const t = i / plant.segments
      const swayAmount = plant.swayAmount * (1 - t) // More sway at the top
      const xOffset = Math.sin(time * plant.swaySpeed + plant.swayOffset) * swayAmount

      const nextX = currentX + xOffset
      const nextY = currentY - segmentHeight

      ctx.beginPath()
      ctx.moveTo(currentX, currentY)
      ctx.lineTo(nextX, nextY)
      ctx.stroke()

      // Draw some leaves
      if (i > 0 && i % 2 === 0) {
        const leafSize = plant.width * (0.8 + Math.sin(time * 0.001 + i) * 0.2)
        ctx.fillStyle = plant.color

        // Left leaf
        ctx.beginPath()
        ctx.ellipse(
          currentX - leafSize / 2,
          currentY - leafSize / 4,
          leafSize,
          leafSize / 2,
          Math.PI / 4,
          0,
          Math.PI * 2,
        )
        ctx.fill()

        // Right leaf
        ctx.beginPath()
        ctx.ellipse(
          currentX + leafSize / 2,
          currentY - leafSize / 4,
          leafSize,
          leafSize / 2,
          -Math.PI / 4,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }

      currentX = nextX
      currentY = nextY
    }
  }

  const drawCoral = (ctx: CanvasRenderingContext2D, coral: CoralReef, time: number) => {
    ctx.fillStyle = coral.color

    switch (coral.type) {
      case "branch":
        drawBranchCoral(ctx, coral, time)
        break
      case "brain":
        drawBrainCoral(ctx, coral, time)
        break
      case "fan":
        drawFanCoral(ctx, coral, time)
        break
    }
  }

  const drawBranchCoral = (ctx: CanvasRenderingContext2D, coral: CoralReef, time: number) => {
    const trunkHeight = coral.size * 1.5
    const branchCount = coral.segments.length

    // Draw trunk
    ctx.fillStyle = coral.color
    ctx.beginPath()
    ctx.moveTo(coral.x - coral.size / 6, coral.y)
    ctx.lineTo(coral.x + coral.size / 6, coral.y)
    ctx.lineTo(coral.x, coral.y - trunkHeight)
    ctx.fill()

    // Draw branches
    for (let i = 0; i < branchCount; i++) {
      const angle = (coral.segments[i] * Math.PI) / 180
      const branchLength = coral.size * (0.4 + Math.random() * 0.6)
      const startY = coral.y - trunkHeight * (0.3 + (i * 0.7) / branchCount)

      ctx.beginPath()
      ctx.moveTo(coral.x, startY)
      ctx.lineTo(coral.x + Math.cos(angle) * branchLength, startY + Math.sin(angle) * branchLength)
      ctx.lineWidth = coral.size / 10
      ctx.strokeStyle = coral.color
      ctx.stroke()

      // Draw small branches at the end
      const endX = coral.x + Math.cos(angle) * branchLength
      const endY = startY + Math.sin(angle) * branchLength
      const smallBranchCount = 3

      for (let j = 0; j < smallBranchCount; j++) {
        const smallAngle = angle + ((Math.random() - 0.5) * Math.PI) / 2
        const smallLength = branchLength * 0.3

        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX + Math.cos(smallAngle) * smallLength, endY + Math.sin(smallAngle) * smallLength)
        ctx.lineWidth = coral.size / 20
        ctx.stroke()
      }
    }
  }

  const drawBrainCoral = (ctx: CanvasRenderingContext2D, coral: CoralReef, time: number) => {
    // Draw base
    ctx.fillStyle = coral.color
    ctx.beginPath()
    ctx.ellipse(coral.x, coral.y - coral.size / 2, coral.size, coral.size / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Draw brain-like ridges
    ctx.strokeStyle = adjustColor(coral.color, -30)
    ctx.lineWidth = coral.size / 15

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radiusX = coral.size * 0.8
      const radiusY = (coral.size / 2) * 0.8

      ctx.beginPath()
      ctx.ellipse(coral.x, coral.y - coral.size / 2, radiusX, radiusY, 0, angle, angle + Math.PI / 8)
      ctx.stroke()

      // Draw some perpendicular ridges
      const x1 = coral.x + Math.cos(angle) * radiusX
      const y1 = coral.y - coral.size / 2 + Math.sin(angle) * radiusY
      const x2 = coral.x + Math.cos(angle + Math.PI / 8) * radiusX
      const y2 = coral.y - coral.size / 2 + Math.sin(angle + Math.PI / 8) * radiusY
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      ctx.beginPath()
      ctx.moveTo(midX, midY)
      ctx.lineTo(midX + (Math.random() - 0.5) * coral.size * 0.3, midY + (Math.random() - 0.5) * coral.size * 0.3)
      ctx.stroke()
    }
  }

  const drawFanCoral = (ctx: CanvasRenderingContext2D, coral: CoralReef, time: number) => {
    // Draw stem
    ctx.fillStyle = coral.color
    ctx.beginPath()
    ctx.moveTo(coral.x - coral.size / 10, coral.y)
    ctx.lineTo(coral.x + coral.size / 10, coral.y)
    ctx.lineTo(coral.x + coral.size / 20, coral.y - coral.size / 2)
    ctx.lineTo(coral.x - coral.size / 20, coral.y - coral.size / 2)
    ctx.fill()

    // Draw fan
    const fanWidth = coral.size * 1.5
    const fanHeight = coral.size
    const fanX = coral.x
    const fanY = coral.y - coral.size / 2

    // Create gradient for fan
    const gradient = ctx.createRadialGradient(fanX, fanY, 0, fanX, fanY, fanWidth / 2)
    gradient.addColorStop(0, coral.color)
    gradient.addColorStop(1, adjustColor(coral.color, -20))
    ctx.fillStyle = gradient

    // Draw fan shape
    ctx.beginPath()
    ctx.ellipse(fanX, fanY, fanWidth / 2, fanHeight / 2, 0, 0, Math.PI)
    ctx.fill()

    // Draw fan details (lines)
    ctx.strokeStyle = adjustColor(coral.color, -40)
    ctx.lineWidth = coral.size / 30

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI + Math.PI / 2
      const length = (fanWidth / 2) * Math.cos(angle - Math.PI / 2)

      if (length > 0) {
        ctx.beginPath()
        ctx.moveTo(fanX, fanY)
        ctx.lineTo(fanX + Math.cos(angle) * length, fanY + Math.sin(angle) * length * 0.8)
        ctx.stroke()
      }
    }
  }

  const drawSand = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create gradient for sand
    const gradient = ctx.createLinearGradient(0, height - 50, 0, height)
    gradient.addColorStop(0, "rgba(240, 230, 180, 0.6)")
    gradient.addColorStop(1, "rgba(210, 200, 160, 0.8)")

    ctx.fillStyle = gradient
    ctx.beginPath()

    // Draw wavy sand
    ctx.moveTo(0, height)

    for (let x = 0; x < width; x += 20) {
      const y = height - 10 - Math.random() * 15
      ctx.lineTo(x, y)
    }

    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()

    // Add some sand details
    ctx.fillStyle = "rgba(180, 170, 140, 0.3)"

    for (let i = 0; i < width / 10; i++) {
      const x = Math.random() * width
      const y = height - Math.random() * 20
      const size = 1 + Math.random() * 3

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawLightRays = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const rayCount = 10
    const rayWidth = width / rayCount

    ctx.save()
    ctx.globalAlpha = 0.1 + Math.sin(time * 0.0005) * 0.05

    for (let i = 0; i < rayCount; i++) {
      const x = i * rayWidth + (Math.sin(time * 0.001 + i) * rayWidth) / 2

      const gradient = ctx.createLinearGradient(x, 0, x, height)
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + rayWidth / 4, 0)
      ctx.lineTo(x + rayWidth / 2, height)
      ctx.lineTo(x - rayWidth / 4, height)
      ctx.closePath()
      ctx.fill()
    }

    ctx.restore()
  }

  const drawCaustics = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.save()
    ctx.globalAlpha = 0.05
    ctx.globalCompositeOperation = "lighter"

    const causticSize = 200
    const causticCount = Math.ceil(width / causticSize) * Math.ceil(height / causticSize)

    for (let i = 0; i < causticCount; i++) {
      const row = Math.floor(i / Math.ceil(width / causticSize))
      const col = i % Math.ceil(width / causticSize)

      const x = col * causticSize + Math.sin(time * 0.001 + row) * 50
      const y = row * causticSize + Math.cos(time * 0.001 + col) * 50

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, causticSize / 2)
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)")
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)")
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, causticSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  // Helper functions
  const getRandomFishColor = () => {
    const colors = [
      "#FF6B35", // Orange
      "#F7C59F", // Light Orange
      "#EFEFD0", // Cream
      "#004E89", // Blue
      "#1A659E", // Light Blue
      "#7A9E7E", // Green
      "#F4E285", // Yellow
      "#D64550", // Red
      "#6B2D5C", // Purple
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const getRandomPlantColor = () => {
    const colors = [
      "#7A9E7E", // Green
      "#8FB996", // Light Green
      "#5F7A61", // Dark Green
      "#3F704D", // Forest Green
      "#9BC4BC", // Teal
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const getRandomCoralColor = () => {
    const colors = [
      "#FF6B6B", // Red
      "#FF9E7A", // Orange
      "#FFD166", // Yellow
      "#F25F5C", // Salmon
      "#A393BF", // Purple
      "#FF99C8", // Pink
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const adjustColor = (color: string, amount: number) => {
    // Convert hex to RGB
    let r = Number.parseInt(color.substring(1, 3), 16)
    let g = Number.parseInt(color.substring(3, 5), 16)
    let b = Number.parseInt(color.substring(5, 7), 16)

    // Adjust
    r = Math.max(0, Math.min(255, r + amount))
    g = Math.max(0, Math.min(255, g + amount))
    b = Math.max(0, Math.min(255, b + amount))

    // Convert back to hex
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" style={{ filter: "blur(0px)" }} />
}
