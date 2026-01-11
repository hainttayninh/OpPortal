import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, canAccessUser, ACTIONS, RESOURCES } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const updateUserSchema = z.object({
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    name: z.string().min(2).optional(),
    phone: z.string().optional().nullable(),
    roleId: z.string().optional(),
    organizationUnitId: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    employeeId: z.string().optional(),
    contractType: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (!canAccessUser(session, id, ACTIONS.VIEW)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id, deletedAt: null },
            include: {
                role: { select: { id: true, name: true, level: true } },
                organizationUnit: { select: { id: true, code: true, name: true, type: true } },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (!canAccessUser(session, id, ACTIONS.UPDATE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { id, deletedAt: null },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prepare update data and handle empty strings for optional unique fields
        const updateData: Record<string, unknown> = { ...validation.data };
        if (updateData.employeeId === '') updateData.employeeId = null;
        if (updateData.contractType === '') updateData.contractType = null;

        // Hash password if provided
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password as string, 12);
        }

        // Check for email/username conflicts
        if (updateData.email || updateData.username) {
            const conflict = await prisma.user.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        updateData.email ? { email: updateData.email as string } : undefined,
                        updateData.username ? { username: updateData.username as string } : undefined,
                    ].filter(Boolean) as { email?: string; username?: string }[],
                    deletedAt: null,
                },
            });

            if (conflict) {
                return NextResponse.json(
                    { error: 'Email or username already exists' },
                    { status: 409 }
                );
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                role: { select: { id: true, name: true, level: true } },
                organizationUnit: { select: { id: true, code: true, name: true, type: true } },
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        const { password: _, ...beforeData } = existingUser;
        const { password: __, ...afterDataUser } = user;

        await createAuditLog(session, {
            action: ActionType.UPDATE,
            entityType: 'User',
            entityId: id,
            beforeData,
            afterData: afterDataUser,
            ...auditInfo,
        });

        return NextResponse.json({ user: afterDataUser });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (!hasPermission(session, ACTIONS.DELETE, RESOURCES.USERS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prevent self-deletion
        if (session.userId === id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id, deletedAt: null },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Soft delete
        await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.DELETE,
            entityType: 'User',
            entityId: id,
            beforeData: { id, email: user.email, username: user.username, name: user.name },
            ...auditInfo,
        });

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
