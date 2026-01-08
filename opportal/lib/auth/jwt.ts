import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload extends JWTPayload {
    userId: string;
    email: string;
    username: string;
    role: string;
    roleLevel: number;
    organizationUnitId: string;
    organizationUnitType: string;
}

/**
 * Sign a JWT token
 */
export async function signToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'nbf'>): Promise<string> {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET);

    return token;
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as TokenPayload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Decode a token without verification (for debugging only)
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
        );
        return payload as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(payload: TokenPayload): boolean {
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiration(expiresIn: string = JWT_EXPIRES_IN): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([dhms])$/);

    if (!match) {
        // Default to 7 days
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const [, value, unit] = match;
    const numValue = parseInt(value);

    switch (unit) {
        case 'd':
            return new Date(now.getTime() + numValue * 24 * 60 * 60 * 1000);
        case 'h':
            return new Date(now.getTime() + numValue * 60 * 60 * 1000);
        case 'm':
            return new Date(now.getTime() + numValue * 60 * 1000);
        case 's':
            return new Date(now.getTime() + numValue * 1000);
        default:
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
}
