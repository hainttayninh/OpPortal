import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES, getScopeFilter } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const createShiftSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
    breakMinutes: z.number().min(0).default(0),
    organizationUnitId: z.string(),
    description: z.string().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.SHIFTS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const organizationUnitId = searchParams.get('organizationUnitId');
        const status = searchParams.get('status');

        const scopeFilter = getScopeFilter(session);
        const where = {
            deletedAt: null,
            ...(scopeFilter.organizationUnitId && !organizationUnitId
                ? { organizationUnitId: scopeFilter.organizationUnitId }
                : {}),
            ...(organizationUnitId ? { organizationUnitId } : {}),
            ...(status ? { status: status as 'DRAFT' | 'ASSIGNED' | 'ACTIVE' | 'COMPLETED' | 'LOCKED' } : {}),
        };

        const [shifts, total] = await Promise.all([
            prisma.shift.findMany({
                where,
                include: {
                    organizationUnit: { select: { id: true, code: true, name: true, type: true } },
                    _count: { select: { assignments: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.shift.count({ where }),
        ]);

        return NextResponse.json({
            shifts,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get shifts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.CREATE, RESOURCES.SHIFTS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createShiftSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { name, code, startTime, endTime, breakMinutes, organizationUnitId, description } = validation.data;

        // Check if code already exists for this org unit
        const existingShift = await prisma.shift.findFirst({
            where: { code, organizationUnitId, deletedAt: null },
        });

        if (existingShift) {
            return NextResponse.json(
                { error: 'Shift code already exists for this organization unit' },
                { status: 409 }
            );
        }

        const shift = await prisma.shift.create({
            data: { name, code, startTime, endTime, breakMinutes, organizationUnitId, description },
            include: {
                organizationUnit: { select: { id: true, code: true, name: true, type: true } },
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.CREATE,
            entityType: 'Shift',
            entityId: shift.id,
            afterData: { name, code, startTime, endTime, organizationUnitId },
            ...auditInfo,
        });

        return NextResponse.json({ shift }, { status: 201 });
    } catch (error) {
        console.error('Create shift error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
