import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ROLES } from '@/lib/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all roles
        const roles = await prisma.role.findMany({
            orderBy: { level: 'asc' },
        });

        return NextResponse.json({ roles });
    } catch (error) {
        console.error('Get roles error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
