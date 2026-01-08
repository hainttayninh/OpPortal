import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const createApprovalSchema = z.object({
    entityType: z.enum(['Attendance', 'Shift', 'KPI']),
    entityId: z.string(),
    action: z.string(),
    reason: z.string().optional(),
    beforeData: z.record(z.unknown()).optional(),
    afterData: z.record(z.unknown()).optional(),
});

const updateApprovalSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.APPROVALS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');
        const entityType = searchParams.get('entityType');

        const where = {
            ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
            ...(entityType ? { entityType } : {}),
        };

        const [approvals, total] = await Promise.all([
            prisma.approvalRequest.findMany({
                where,
                include: {
                    requester: { select: { id: true, name: true, email: true } },
                    approver: { select: { id: true, name: true, email: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.approvalRequest.count({ where }),
        ]);

        return NextResponse.json({
            approvals,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get approvals error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = createApprovalSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { entityType, entityId, action, reason, beforeData, afterData } = validation.data;

        const approval = await prisma.approvalRequest.create({
            data: {
                entityType,
                entityId,
                action,
                reason,
                beforeData: beforeData as object ?? undefined,
                afterData: afterData as object ?? undefined,
                requesterId: session.userId,
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.CREATE,
            entityType: 'ApprovalRequest',
            entityId: approval.id,
            afterData: { entityType, entityId, action },
            ...auditInfo,
        });

        return NextResponse.json({ approval }, { status: 201 });
    } catch (error) {
        console.error('Create approval error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
