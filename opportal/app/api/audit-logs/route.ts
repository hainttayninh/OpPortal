import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES, ROLES } from '@/lib/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin and Manager can view audit logs
        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.AUDIT_LOGS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const actorId = searchParams.get('actorId');
        const entityType = searchParams.get('entityType');
        const action = searchParams.get('action');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where = {
            ...(actorId ? { actorId } : {}),
            ...(entityType ? { entityType } : {}),
            ...(action ? { action: action as 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOCK' | 'UNLOCK' } : {}),
            ...(startDate && endDate
                ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
                : {}),
        };

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    actor: { select: { id: true, name: true, email: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({
            auditLogs: logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
