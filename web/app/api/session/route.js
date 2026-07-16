import crypto from 'crypto'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SESSION_KEY = '__alphaServerSessionId'

function getServerSessionId() {
  if (!globalThis[SESSION_KEY]) {
    globalThis[SESSION_KEY] = crypto.randomUUID()
  }

  return globalThis[SESSION_KEY]
}

export async function GET() {
  return NextResponse.json(
    { sessionId: getServerSessionId() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    }
  )
}

