// Utility functions for encryption

export function encodeBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(data)))
}

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export function generateRandomKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}

export function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  return crypto.subtle.digest("SHA-256", data).then((hash) => {
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  })
}
