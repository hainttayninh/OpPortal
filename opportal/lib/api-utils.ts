import { NextRequest, NextResponse } from 'next/server';
import { getSession, type TokenPayload, hasPermission, type ActionName, type ResourceName } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
    user: TokenPayload;
}

type RouteHandler = (
    request: AuthenticatedRequest,
    context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wrapper for API routes that require authentication
 */
export function withAuth(handler: RouteHandler): (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> {
    return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please log in to continue' },
                { status: 401 }
            );
        }

        // Attach user to request
        const authenticatedRequest = request as AuthenticatedRequest;
        authenticatedRequest.user = session;

        return handler(authenticatedRequest, context);
    };
}

/**
 * Wrapper for API routes that require authentication and specific permission
 */
export function withPermission(
    action: ActionName,
    resource: ResourceName,
    handler: RouteHandler
): (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
    return withAuth(async (request: AuthenticatedRequest, context) => {
        const user = request.user;

        if (!hasPermission(user, action, resource)) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'You do not have permission to perform this action' },
                { status: 403 }
            );
        }

        return handler(request, context);
    });
}

/**
 * Wrapper for API routes that require specific roles
 */
export function withRoles(
    roles: string[],
    handler: RouteHandler
): (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
    return withAuth(async (request: AuthenticatedRequest, context) => {
        const user = request.user;

        if (!roles.includes(user.role)) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'You do not have the required role to perform this action' },
                { status: 403 }
            );
        }

        return handler(request, context);
    });
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 400): NextResponse {
    return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/**
 * Parse and validate request body
 */
export async function parseBody<T>(request: NextRequest): Promise<T | null> {
    try {
        return await request.json() as T;
    } catch {
        return null;
    }
}
