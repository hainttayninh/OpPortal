import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES, getScopeFilter } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    roleId: z.string(),
    organizationUnitId: z.string(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.USERS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const roleId = searchParams.get('roleId');
        const organizationUnitId = searchParams.get('organizationUnitId');
        const status = searchParams.get('status');

        // Build where clause based on scope
        const scopeFilter = getScopeFilter(session);
        const where = {
            deletedAt: null,
            ...(scopeFilter.userId ? { id: scopeFilter.userId } : {}),
            ...(scopeFilter.organizationUnitId && !organizationUnitId
                ? { organizationUnitId: scopeFilter.organizationUnitId }
                : {}),
            ...(organizationUnitId ? { organizationUnitId } : {}),
            ...(roleId ? { roleId } : {}),
            ...(status ? { status: status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' } : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' as const } },
                        { email: { contains: search, mode: 'insensitive' as const } },
                        { username: { contains: search, mode: 'insensitive' as const } },
                    ],
                }
                : {}),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    role: { select: { id: true, name: true } },
                    organizationUnit: { select: { id: true, code: true, name: true, type: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        // Remove passwords from response
        const sanitizedUsers = users.map(({ password: _, ...user }) => user);

        return NextResponse.json({
            users: sanitizedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.CREATE, RESOURCES.USERS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { email, username, password, name, phone, roleId, organizationUnitId } = validation.data;

        // Check if email or username already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
                deletedAt: null,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: existingUser.email === email ? 'Email already exists' : 'Username already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                name,
                phone,
                roleId,
                organizationUnitId,
            },
            include: {
                role: { select: { id: true, name: true } },
                organizationUnit: { select: { id: true, code: true, name: true, type: true } },
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.CREATE,
            entityType: 'User',
            entityId: user.id,
            afterData: { email, username, name, roleId, organizationUnitId },
            ...auditInfo,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
