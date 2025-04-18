import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Create a SQL client with the connection string
export const sql = neon(process.env.DATABASE_URL!)

// Create a Drizzle client with the SQL client
export const db = drizzle(sql)

// Helper function to generate a unique room code
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
