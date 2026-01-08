import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.email || data.username, {
    message: 'Email or username is required',
});

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Validate input
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { email, username, password } = validation.data;

        // Find user by email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    email ? { email } : undefined,
                    username ? { username } : undefined,
                ].filter(Boolean) as { email?: string; username?: string }[],
                deletedAt: null,
            },
            include: {
                role: true,
                organizationUnit: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Account is not active. Please contact administrator.' },
                { status: 403 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create session
        await setSession({
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role.name,
            roleLevel: user.role.level,
            organizationUnitId: user.organizationUnitId,
            organizationUnitType: user.organizationUnit.type,
        });

        // Create audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(
            {
                userId: user.id,
                email: user.email,
                username: user.username,
                role: user.role.name,
                roleLevel: user.role.level,
                organizationUnitId: user.organizationUnitId,
                organizationUnitType: user.organizationUnit.type,
            },
            {
                action: ActionType.CREATE,
                entityType: 'Session',
                entityId: user.id,
                afterData: { login: true },
                ...auditInfo,
            }
        );

        // Return user data (without password)
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                role: user.role.name,
                organizationUnit: {
                    id: user.organizationUnit.id,
                    name: user.organizationUnit.name,
                    type: user.organizationUnit.type,
                },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
