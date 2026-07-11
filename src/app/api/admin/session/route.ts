import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const SESSION_COOKIE_NAME = '__session';
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const SESSION_DURATION_SECONDS = SESSION_DURATION_MS / 1000;

export async function POST(request: NextRequest) {
  let idToken: string;
  try {
    const body = await request.json();
    if (!body?.idToken || typeof body.idToken !== 'string') throw new Error();
    idToken = body.idToken;
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email) {
      return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
    }

    const adminDoc = await adminDb.collection('admins').doc(decoded.email).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ message: 'Access denied. Your account is not authorised to access the admin panel.' }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ message: 'Authentication failed. Please try signing in again.' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
