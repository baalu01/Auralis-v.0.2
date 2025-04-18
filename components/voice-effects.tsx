"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Wand2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

type VoiceEffect = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  hasIntensity?: boolean
}

const VOICE_EFFECTS: VoiceEffect[] = [
  {
    id: "none",
    name: "Normal",
    description: "Your natural voice",
    icon: "🔊",
  },
  {
    id: "robot",
    name: "Robot",
    description: "Sound like a robot",
    icon: "🤖",
    hasIntensity: true,
  },
  {
    id: "echo",
    name: "Echo",
    description: "Add echo to your voice",
    icon: "🔄",
    hasIntensity: true,
  },
  {
    id: "pitch",
    name: "Pitch Shift",
    description: "Change the pitch of your voice",
    icon: "📈",
    hasIntensity: true,
  },
  {
    id: "reverb",
    name: "Reverb",
    description: "Add spacious reverb to your voice",
    icon: "🏛️",
    hasIntensity: true,
  },
  {
    id: "distortion",
    name: "Distortion",
    description: "Add gritty distortion to your voice",
    icon: "⚡",
    hasIntensity: true,
  },
  {
    id: "telephone",
    name: "Telephone",
    description: "Sound like you're on an old telephone",
    icon: "☎️",
  },
  {
    id: "underwater",
    name: "Underwater",
    description: "Sound like you're speaking underwater",
    icon: "🌊",
  },
  {
    id: "alien",
    name: "Alien",
    description: "Sound like an extraterrestrial being",
    icon: "👽",
  },
]

type VoiceEffectsProps = {
  activeEffect: string
  onEffectChange: (effect: string, intensity?: number) => void
  enabled: boolean
  onToggle: () => void
  intensity?: number
  onIntensityChange?: (intensity: number) => void
}

export function VoiceEffects({
  activeEffect,
  onEffectChange,
  enabled,
  onToggle,
  intensity = 50,
  onIntensityChange,
}: VoiceEffectsProps) {
  const [open, setOpen] = useState(false)
  const [localIntensity, setLocalIntensity] = useState(intensity)

  const handleIntensityChange = (value: number[]) => {
    const newIntensity = value[0]
    setLocalIntensity(newIntensity)
    onIntensityChange?.(newIntensity)
  }

  const currentEffect = VOICE_EFFECTS.find((effect) => effect.id === activeEffect) || VOICE_EFFECTS[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={enabled ? "default" : "outline"} size="icon" className="rounded-full h-10 w-10">
          <Wand2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Voice Effects</h3>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onToggle}>
              {enabled ? "Disable" : "Enable"}
            </Button>
          </div>

          {currentEffect.hasIntensity && enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="intensity" className="text-xs">
                  Intensity
                </Label>
                <span className="text-xs text-muted-foreground">{localIntensity}%</span>
              </div>
              <Slider
                id="intensity"
                min={0}
                max={100}
                step={1}
                value={[localIntensity]}
                onValueChange={handleIntensityChange}
                disabled={!enabled}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {VOICE_EFFECTS.map((effect) => (
              <button
                key={effect.id}
                className={`flex flex-col items-center gap-1 p-3 rounded-md text-sm ${
                  activeEffect === effect.id && enabled ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => {
                  onEffectChange(effect.id, localIntensity)
                  if (!enabled) onToggle()
                }}
                disabled={!enabled && effect.id !== "none"}
              >
                <span className="text-2xl">{effect.icon}</span>
                <div className="font-medium text-xs">{effect.name}</div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
