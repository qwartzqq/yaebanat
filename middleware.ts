import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Basic security headers (helps against common XSS / clickjacking / MIME sniffing)
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // NOTE: CSP here is intentionally compatible with Next.js.
  // If you later tighten it, test the site thoroughly.
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https:",
    ].join("; ")
  )

  // HSTS only makes sense on HTTPS (safe to set anyway)
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

  return res
}

export const config = {
  matcher: ["/:path*"],
}
