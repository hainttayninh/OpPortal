import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES, getScopeFilter } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const createKPISchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    type: z.enum(['ASSIGNED', 'SELF_REGISTERED']),
    period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
    notes: z.string().optional(),
    items: z.array(z.object({
        description: z.string().min(3, 'Description must be at least 3 characters'),
        weight: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
        target: z.string().min(1, 'Target is required'),
    })).optional(),
    userId: z.string().optional(), // For assigning KPI to another user (Leaders/Managers)
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.KPI)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const userId = searchParams.get('userId');
        const type = searchParams.get('type');
        const period = searchParams.get('period');
        const status = searchParams.get('status');

        const scopeFilter = getScopeFilter(session);
        const where = {
            ...(scopeFilter.userId ? { userId: scopeFilter.userId } : {}),
            ...(userId ? { userId } : {}),
            ...(type ? { type: type as 'ASSIGNED' | 'SELF_REGISTERED' } : {}),
            ...(period ? { period: period as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' } : {}),
            ...(status ? { status: status as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_PROGRESS' | 'EVALUATED' | 'CLOSED' } : {}),
        };

        const [kpis, total] = await Promise.all([
            prisma.kPI.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: true,
                    evaluations: {
                        include: {
                            evaluator: { select: { id: true, name: true } },
                        },
                    },
                    _count: { select: { items: true, evaluations: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.kPI.count({ where }),
        ]);

        return NextResponse.json({
            kpis,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get KPIs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.CREATE, RESOURCES.KPI)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createKPISchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { title, type, period, startDate, endDate, notes, items, userId } = validation.data;

        // Validate total weight equals 100
        if (items && items.length > 0) {
            const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
            if (totalWeight !== 100) {
                return NextResponse.json(
                    { error: `Total KPI weight must be exactly 100%. Current: ${totalWeight}%` },
                    { status: 400 }
                );
            }
        }

        // Determine target user
        const targetUserId = userId || session.userId;

        // Only Leaders/Managers can assign KPIs to others
        if (userId && userId !== session.userId) {
            if (session.role === 'User') {
                return NextResponse.json(
                    { error: 'Users can only create self-registered KPIs' },
                    { status: 403 }
                );
            }
        }

        const kpi = await prisma.kPI.create({
            data: {
                title,
                type,
                period,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                notes,
                userId: targetUserId,
                totalWeight: items ? items.reduce((sum, item) => sum + item.weight, 0) : 0,
                items: items ? {
                    create: items.map((item) => ({
                        description: item.description,
                        weight: item.weight,
                        target: item.target,
                    })),
                } : undefined,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: true,
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.CREATE,
            entityType: 'KPI',
            entityId: kpi.id,
            afterData: { title, type, period, userId: targetUserId, itemCount: items?.length || 0 },
            ...auditInfo,
        });

        return NextResponse.json({ kpi }, { status: 201 });
    } catch (error) {
        console.error('Create KPI error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
