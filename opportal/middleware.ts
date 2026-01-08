import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { ROLES, ROLE_LEVELS } from '@/lib/auth/rbac';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login'];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
    '/admin': [ROLES.ADMIN],
    '/users': [ROLES.ADMIN, ROLES.MANAGER],
    '/organization': [ROLES.ADMIN, ROLES.MANAGER],
    '/audit-logs': [ROLES.ADMIN, ROLES.MANAGER],
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Allow static assets and API routes that handle their own auth
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/icons') ||
        pathname.startsWith('/manifest') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.ico')
    ) {
        return NextResponse.next();
    }

    // Check authentication for protected routes
    const session = await getSessionFromRequest(request);

    if (!session) {
        // Redirect to login for page requests
        if (!pathname.startsWith('/api/')) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Return 401 for API requests
        return NextResponse.json(
            { error: 'Unauthorized', message: 'Please log in to continue' },
            { status: 401 }
        );
    }

    // Check role-based access for specific routes
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(route)) {
            if (!allowedRoles.includes(session.role)) {
                if (!pathname.startsWith('/api/')) {
                    // Redirect to dashboard if not authorized
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
                return NextResponse.json(
                    { error: 'Forbidden', message: 'You do not have access to this resource' },
                    { status: 403 }
                );
            }
        }
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.userId);
    response.headers.set('x-user-role', session.role);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
