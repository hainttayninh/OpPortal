import { NextResponse } from 'next/server';
import { clearSession, getSession } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();

        if (session) {
            // Create audit log before clearing session
            const auditInfo = getAuditInfo(request.headers);
            await createAuditLog(session, {
                action: ActionType.DELETE,
                entityType: 'Session',
                entityId: session.userId,
                beforeData: { login: true },
                afterData: { login: false },
                ...auditInfo,
            });
        }

        // Clear the session cookie
        await clearSession();

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
