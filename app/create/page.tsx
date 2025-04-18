"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Copy } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { createRoom } from "../actions/rooms"

export default function CreatePage() {
  const router = useRouter()
  const [spaceName, setSpaceName] = useState("")
  const [isPersistent, setIsPersistent] = useState(false)
  const [isCreated, setIsCreated] = useState(false)
  const [spaceCode, setSpaceCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("name", spaceName)
    if (isPersistent) {
      formData.append("isPersistent", "on")
    }

    try {
      const result = await createRoom(formData)

      if (result.success) {
        setSpaceCode(result.roomCode!)
        setIsCreated(true)
      } else {
        setError(result.error || "Failed to create room")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = () => {
    router.push(`/lobby?code=${spaceCode}`)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(spaceCode)
    // You could add a toast notification here
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 lg:px-8 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-xl font-semibold tracking-tight">Auralis</span>
        </Link>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isCreated ? "Space Created" : "Create New Space"}</CardTitle>
            <CardDescription>
              {isCreated
                ? "Your audio space is ready. Share the code with friends to invite them."
                : "Set up a new audio space for you and your friends."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md">
                {error}
              </div>
            )}

            {!isCreated ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Space Name</Label>
                  <Input
                    id="name"
                    placeholder="My Audio Space"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="persistent" checked={isPersistent} onCheckedChange={setIsPersistent} />
                  <Label htmlFor="persistent">Make this space persistent</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPersistent
                    ? "This space will remain available with the same code for future sessions."
                    : "This space will be deleted when everyone leaves."}
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg border flex justify-between items-center">
                  <span className="text-2xl font-mono tracking-wider">{spaceCode}</span>
                  <Button variant="ghost" size="icon" onClick={copyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this code with friends so they can join your space.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            {!isCreated ? (
              <Button type="submit" onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Space"}
              </Button>
            ) : (
              <Button onClick={handleJoin}>Join Now</Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
