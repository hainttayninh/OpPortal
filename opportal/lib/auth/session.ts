import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { signToken, verifyToken, getTokenExpiration, type TokenPayload } from './jwt';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'opportal-session';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

/**
 * Set the session cookie with JWT token (Server Component / API Route)
 */
export async function setSession(payload: Omit<TokenPayload, 'iat' | 'exp' | 'nbf'>): Promise<string> {
    const token = await signToken(payload);
    const expires = getTokenExpiration();

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        ...COOKIE_OPTIONS,
        expires,
    });

    return token;
}

/**
 * Get the current session from cookies (Server Component / API Route)
 */
export async function getSession(): Promise<TokenPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}

/**
 * Clear the session cookie (Server Component / API Route)
 */
export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

/**
 * Set session cookie in response (for Middleware)
 */
export function setSessionCookie(
    response: NextResponse,
    token: string
): NextResponse {
    const expires = getTokenExpiration();

    response.cookies.set(COOKIE_NAME, token, {
        ...COOKIE_OPTIONS,
        expires,
    });

    return response;
}

/**
 * Get session from request (for Middleware)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<TokenPayload | null> {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}

/**
 * Clear session cookie in response (for Middleware)
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
    response.cookies.delete(COOKIE_NAME);
    return response;
}

/**
 * Refresh the session token
 */
export async function refreshSession(): Promise<TokenPayload | null> {
    const session = await getSession();

    if (!session) {
        return null;
    }

    // Create a new token with the same payload
    const newPayload = {
        userId: session.userId,
        email: session.email,
        username: session.username,
        role: session.role,
        roleLevel: session.roleLevel,
        organizationUnitId: session.organizationUnitId,
        organizationUnitType: session.organizationUnitType,
    };

    await setSession(newPayload);

    return { ...newPayload } as TokenPayload;
}
