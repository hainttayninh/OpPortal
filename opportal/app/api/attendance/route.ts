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
    userId: z.string().optional(),
    status: z.string().optional(),
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

        const { date, checkIn, checkOut, notes, shiftAssignmentId, status } = validation.data;
        let userId = validation.data.userId || session.userId;

        // Verify permission if creating for another user
        if (userId !== session.userId) {
            // Check if user has permission to manage attendance or is admin/manager
            // For simplicity, assuming if they can CREATE attendance resource, they can do it for others if they provide userId
            // Ideally should check scope, but relying on general permission for now
            if (session.role === 'User') {
                return NextResponse.json({ error: 'Forbidden - Cannot create attendance for others' }, { status: 403 });
            }
        }

        // Check if attendance already exists for this user on this date
        const existingAttendance = await prisma.attendance.findUnique({
            where: { userId_date: { userId, date: new Date(date) } },
        });

        if (existingAttendance) {
            // Update if exists (upsert behavior for Chấm công tab)
            const attendance = await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                    status: status || existingAttendance.status,
                    notes: notes ? (existingAttendance.notes ? existingAttendance.notes + '; ' + notes : notes) : existingAttendance.notes,
                },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                }
            });
            return NextResponse.json({ attendance }, { status: 200 });
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
                status: status || 'PENDING',
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

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.UPDATE, RESOURCES.ATTENDANCE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 });
        }

        const existingAttendance = await prisma.attendance.findUnique({
            where: { id },
        });

        if (!existingAttendance) {
            return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
        }

        // Only allow users to update their own attendance (unless admin/manager)
        if (existingAttendance.userId !== session.userId && session.role === 'User') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateAttendanceSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { checkIn, checkOut, notes, adjustmentReason, status } = validation.data;

        // Calculate working minutes if both check-in and check-out available
        let workingMinutes = existingAttendance.workingMinutes;
        const finalCheckIn = checkIn ? new Date(checkIn) : existingAttendance.checkIn;
        const finalCheckOut = checkOut ? new Date(checkOut) : existingAttendance.checkOut;

        if (finalCheckIn && finalCheckOut) {
            const diffMs = finalCheckOut.getTime() - finalCheckIn.getTime();
            workingMinutes = Math.floor(diffMs / 60000);
        }

        const attendance = await prisma.attendance.update({
            where: { id },
            data: {
                ...(checkIn && { checkIn: new Date(checkIn) }),
                ...(checkOut && { checkOut: new Date(checkOut) }),
                ...(notes !== undefined && { notes }),
                ...(adjustmentReason && { adjustmentReason }),
                ...(status && { status }),
                workingMinutes,
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
            action: ActionType.UPDATE,
            entityType: 'Attendance',
            entityId: attendance.id,
            beforeData: { checkIn: existingAttendance.checkIn, checkOut: existingAttendance.checkOut },
            afterData: { checkIn: attendance.checkIn, checkOut: attendance.checkOut },
            ...auditInfo,
        });

        return NextResponse.json({ attendance });
    } catch (error) {
        console.error('Update attendance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
