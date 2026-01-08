import { NextResponse } from 'next/server';
import { getSession, refreshSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Fetch fresh user data from database
        const user = await prisma.user.findUnique({
            where: {
                id: session.userId,
                deletedAt: null,
            },
            include: {
                role: true,
                organizationUnit: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Account is not active' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role.name,
                roleLevel: user.role.level,
                organizationUnit: {
                    id: user.organizationUnit.id,
                    code: user.organizationUnit.code,
                    name: user.organizationUnit.name,
                    type: user.organizationUnit.type,
                },
            },
        });
    } catch (error) {
        console.error('Get me error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(): Promise<NextResponse> {
    try {
        const newSession = await refreshSession();

        if (!newSession) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Session refreshed',
        });
    } catch (error) {
        console.error('Refresh session error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
