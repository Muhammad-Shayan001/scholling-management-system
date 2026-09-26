import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Rate limit configuration
const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per window
  },
  API: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per window
  },
};

// Simple in-memory store for rate limiting
// NOTE: In a production distributed environment (Vercel/AWS),
// this should be replaced with Redis (Upstash)
const requestStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limitType: 'AUTH' | 'API'): { limited: boolean; resetAt?: number } {
  const config = RATE_LIMITS[limitType];
  const key = `${limitType}:${ip}`;
  const now = Date.now();

  const record = requestStore.get(key);

  if (!record || now > record.resetAt) {
    requestStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { limited: false };
  }

  if (record.count >= config.max) {
    return { limited: true, resetAt: record.resetAt };
  }

  requestStore.set(key, { count: record.count + 1, resetAt: record.resetAt });
  return { limited: false };
}

export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const url = request.nextUrl;

  let limitType: 'AUTH' | 'API' | null = null;

  if (url.pathname.startsWith('/(auth)') || url.pathname.startsWith('/api/auth')) {
    limitType = 'AUTH';
  } else if (url.pathname.startsWith('/api')) {
    limitType = 'API';
  }

  if (limitType) {
    const { limited, resetAt } = isRateLimited(ip, limitType);
    if (limited) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((resetAt! - Date.now()) / 1000).toString()
          }
        }
      );
    }
  }

  return NextResponse.next();
}
