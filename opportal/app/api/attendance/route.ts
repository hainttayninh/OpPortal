import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES, getScopeFilter } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const createAttendanceSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().optional(),
    notes: z.string().optional(),
    shiftAssignmentId: z.string().optional(),
});

const updateAttendanceSchema = z.object({
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().optional(),
    notes: z.string().optional(),
    adjustmentReason: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'ADJUSTED', 'LOCKED']).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.ATTENDANCE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');

        const scopeFilter = getScopeFilter(session);
        const where = {
            ...(scopeFilter.userId ? { userId: scopeFilter.userId } : {}),
            ...(userId ? { userId } : {}),
            ...(status ? { status: status as 'PENDING' | 'CONFIRMED' | 'ADJUSTED' | 'LOCKED' } : {}),
            ...(startDate && endDate
                ? { date: { gte: new Date(startDate), lte: new Date(endDate) } }
                : {}),
        };

        const [attendances, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    shiftAssignment: {
                        include: {
                            shift: { select: { id: true, name: true, startTime: true, endTime: true } },
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { date: 'desc' },
            }),
            prisma.attendance.count({ where }),
        ]);

        return NextResponse.json({
            attendances,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get attendances error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.CREATE, RESOURCES.ATTENDANCE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createAttendanceSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { date, checkIn, checkOut, notes, shiftAssignmentId } = validation.data;
        const userId = session.userId;

        // Check if attendance already exists for this user on this date
        const existingAttendance = await prisma.attendance.findUnique({
            where: { userId_date: { userId, date: new Date(date) } },
        });

        if (existingAttendance) {
            return NextResponse.json(
                { error: 'Attendance already recorded for this date' },
                { status: 409 }
            );
        }

        // Calculate working minutes if both check-in and check-out provided
        let workingMinutes = 0;
        if (checkIn && checkOut) {
            const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
            workingMinutes = Math.floor(diffMs / 60000);
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId,
                date: new Date(date),
                checkIn: checkIn ? new Date(checkIn) : null,
                checkOut: checkOut ? new Date(checkOut) : null,
                workingMinutes,
                notes,
                shiftAssignmentId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                shiftAssignment: {
                    include: {
                        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
                    },
                },
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.CREATE,
            entityType: 'Attendance',
            entityId: attendance.id,
            afterData: { date, checkIn, checkOut, userId },
            ...auditInfo,
        });

        return NextResponse.json({ attendance }, { status: 201 });
    } catch (error) {
        console.error('Create attendance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
