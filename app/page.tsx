import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowRight,
  Headphones,
  MessageSquare,
  Monitor,
  Sparkles,
  Shield,
  Zap,
  Lock,
  Users,
  Mic,
  Globe,
  Award,
  Clock,
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { getCurrentUser, logout } from "./actions/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 lg:px-8 h-16 flex items-center border-b backdrop-blur-md bg-background/70">
        <Link className="flex items-center justify-center" href="#">
          <span className="text-xl font-semibold tracking-tight">Auralis</span>
        </Link>
        <nav className="ml-10 hidden md:flex gap-6">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#why-auralis" className="text-sm font-medium hover:text-primary transition-colors">
            Why Auralis
          </Link>
          <Link href="#roadmap" className="text-sm font-medium hover:text-primary transition-colors">
            Roadmap
          </Link>
          <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
            Testimonials
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, {user.displayName || user.username}</span>
              <form action={logout}>
                <Button variant="ghost" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex items-center justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <Badge variant="outline" className="px-3 py-1 text-sm backdrop-blur-sm bg-background/30">
                <span className="text-gradient">Introducing Auralis 1.0</span>
              </Badge>
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                  Connect Through Sound
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl backdrop-blur-sm bg-background/30 p-4 rounded-lg">
                  Auralis brings friends together in an elegant audio space. Private, minimalist, and designed for
                  meaningful connection in a world of digital noise.
                </p>
              </div>

              {user ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
                  <div className="flex flex-col items-center space-y-4 p-6 bg-background/40 backdrop-blur-lg rounded-2xl border border-blue-200/20 dark:border-blue-800/20 transition-all hover:shadow-md hover:shadow-blue-500/10">
                    <JoinWithCode />
                    <p className="text-sm text-muted-foreground">Enter a code to join an existing space</p>
                  </div>

                  <div className="flex flex-col items-center space-y-4 p-6 bg-background/40 backdrop-blur-lg rounded-2xl border border-blue-200/20 dark:border-blue-800/20 transition-all hover:shadow-md hover:shadow-blue-500/10">
                    <Link href="/create" className="w-full">
                      <Button
                        className="w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        size="lg"
                      >
                        Create New Space
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground">Start a new audio space for your friends</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  <p className="text-muted-foreground backdrop-blur-sm bg-background/30 p-2 rounded-lg">
                    Sign up or login to create and join audio spaces
                  </p>
                  <div className="flex gap-4">
                    <Link href="/signup">
                      <Button
                        size="lg"
                        className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full border-blue-200/20 dark:border-blue-800/20"
                      >
                        Login
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 bg-background/40 backdrop-blur-md">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  Features
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Everything You Need for Immersive Audio
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Auralis combines crystal-clear audio with powerful features to create the perfect communication
                  platform.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              <FeatureCard
                icon={<Headphones className="h-10 w-10 text-blue-400" />}
                title="Crystal Clear Audio"
                description="High-quality audio communication with advanced noise suppression for natural conversations"
              />
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-purple-400" />}
                title="Text Chat"
                description="Share links and messages alongside your voice with end-to-end encryption"
              />
              <FeatureCard
                icon={<Monitor className="h-10 w-10 text-cyan-400" />}
                title="Screen Sharing"
                description="Present ideas visually with one-click sharing and high-definition quality"
              />
              <FeatureCard
                icon={<Sparkles className="h-10 w-10 text-amber-400" />}
                title="Voice Effects"
                description="Add fun effects to your voice in real-time with adjustable intensity controls"
              />
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-green-400" />}
                title="Privacy First"
                description="End-to-end encryption for all communications with no data collection"
              />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-yellow-400" />}
                title="Low Latency"
                description="Optimized for minimal delay, even on slower connections"
              />
              <FeatureCard
                icon={<Lock className="h-10 w-10 text-red-400" />}
                title="Secure Rooms"
                description="Private spaces with unique codes and admin controls"
              />
              <FeatureCard
                icon={<Users className="h-10 w-10 text-indigo-400" />}
                title="Group Spaces"
                description="Connect with up to 50 people simultaneously in a single room"
              />
            </div>
          </div>
        </section>

        {/* Why Auralis Section */}
        <section id="why-auralis" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  Why Choose Us
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  What Makes Auralis Different
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  In a world of video calls and text messages, Auralis offers a refreshing alternative.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <Card className="bg-background/40 backdrop-blur-md border-blue-200/20 dark:border-blue-800/20">
                <CardContent className="p-6 space-y-4">
                  <Mic className="h-12 w-12 text-blue-500" />
                  <h3 className="text-xl font-bold">Audio-First Experience</h3>
                  <p className="text-muted-foreground">
                    While other platforms prioritize video, Auralis focuses on audio quality. This reduces bandwidth
                    requirements and creates a more natural, less fatiguing experience.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background/40 backdrop-blur-md border-blue-200/20 dark:border-blue-800/20">
                <CardContent className="p-6 space-y-4">
                  <Globe className="h-12 w-12 text-purple-500" />
                  <h3 className="text-xl font-bold">Designed for Connection</h3>
                  <p className="text-muted-foreground">
                    Our platform is built to foster genuine human connection. Without the pressure of being on camera,
                    conversations flow more naturally and authentically.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background/40 backdrop-blur-md border-blue-200/20 dark:border-blue-800/20">
                <CardContent className="p-6 space-y-4">
                  <Award className="h-12 w-12 text-amber-500" />
                  <h3 className="text-xl font-bold">Unmatched Quality</h3>
                  <p className="text-muted-foreground">
                    We've invested heavily in audio processing technology to deliver studio-quality sound, even on
                    consumer-grade microphones and headsets.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section id="roadmap" className="w-full py-12 md:py-24 bg-background/40 backdrop-blur-md">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  Roadmap
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">The Future of Auralis</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  We're just getting started. Here's what's coming next.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              <RoadmapCard
                icon={<Clock className="h-10 w-10 text-blue-400" />}
                title="Q3 2023"
                items={[
                  "Mobile apps for iOS and Android",
                  "Advanced audio filters and effects",
                  "Custom room backgrounds",
                  "Expanded voice effect library",
                ]}
                current
              />
              <RoadmapCard
                icon={<Clock className="h-10 w-10 text-purple-400" />}
                title="Q4 2023"
                items={[
                  "Spatial audio for immersive experiences",
                  "Audio recording and playback",
                  "Custom room permissions",
                  "Integration with popular platforms",
                ]}
              />
              <RoadmapCard
                icon={<Clock className="h-10 w-10 text-green-400" />}
                title="2024"
                items={[
                  "AI-powered transcription and translation",
                  "Virtual audio spaces with 3D positioning",
                  "Developer API for custom integrations",
                  "Enterprise features and team management",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  Testimonials
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Users Say</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Don't just take our word for it. Here's what people are saying about Auralis.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <TestimonialCard
                quote="Auralis has completely changed how our remote team collaborates. The audio quality is incredible, and the voice effects add a fun element to our daily standups."
                author="Sarah J."
                role="Product Manager"
              />
              <TestimonialCard
                quote="As someone who suffers from video call fatigue, Auralis is a breath of fresh air. I can focus on the conversation without worrying about how I look or my background."
                author="Michael T."
                role="Software Developer"
              />
              <TestimonialCard
                quote="The screen sharing feature combined with crystal clear audio makes Auralis perfect for our online tutoring sessions. My students love it!"
                author="Dr. Lisa R."
                role="University Professor"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center text-white">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Experience Auralis?
                </h2>
                <p className="mx-auto max-w-[700px] md:text-xl opacity-90">
                  Join thousands of users who are already enjoying better audio communication.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href="/signup">
                  <Button size="lg" className="rounded-full bg-white text-blue-600 hover:bg-blue-50">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-white text-white hover:bg-white/10"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8 backdrop-blur-md bg-background/70">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-lg font-semibold">Auralis</span>
            <p className="text-sm text-muted-foreground">© 2023 Auralis. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Contact
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function JoinWithCode() {
  return (
    <div className="flex w-full items-center space-x-2">
      <form className="flex w-full items-center space-x-2" action="/lobby">
        <Input
          type="text"
          placeholder="Enter space code"
          className="rounded-full border-input bg-background/70 backdrop-blur-sm px-4 py-2 text-sm focus-visible:ring-1"
          name="code"
          required
        />
        <Button
          type="submit"
          className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          size="sm"
        >
          <ArrowRight className="h-4 w-4" />
          <span className="sr-only">Join</span>
        </Button>
      </form>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background/30 backdrop-blur-sm rounded-xl border border-blue-200/10 dark:border-blue-800/10 transition-all hover:shadow-md hover:shadow-blue-500/5">
      <div className="p-3 rounded-full bg-background/50">{icon}</div>
      <h3 className="text-xl font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function RoadmapCard({
  icon,
  title,
  items,
  current = false,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
  current?: boolean
}) {
  return (
    <Card
      className={`bg-background/40 backdrop-blur-md border-blue-200/20 dark:border-blue-800/20 ${current ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background" : ""}`}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          {icon}
          {current && (
            <Badge variant="default" className="bg-blue-500">
              Current
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <Card className="bg-background/40 backdrop-blur-md border-blue-200/20 dark:border-blue-800/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-blue-500 opacity-20"
          >
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        </div>
        <p className="text-muted-foreground italic">{quote}</p>
        <div className="pt-4 border-t border-border">
          <p className="font-medium">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  )
}
