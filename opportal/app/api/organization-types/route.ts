import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES } from '@/lib/auth';
import { z } from 'zod';

const createTypeSchema = z.object({
    code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code must be at most 20 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    level: z.number().min(0).max(10).default(0),
    color: z.string().optional(),
});

const updateTypeSchema = createTypeSchema.partial();

// System types that cannot be deleted
const SYSTEM_TYPES = [
    { code: 'TTVH', name: 'Trung tâm Vận hành', level: 0, color: 'bg-purple-100 text-purple-700' },
    { code: 'BCVH', name: 'Bưu cục Vận hành', level: 1, color: 'bg-blue-100 text-blue-700' },
    { code: 'BCP', name: 'Bưu cục Phát', level: 2, color: 'bg-emerald-100 text-emerald-700' },
    { code: 'DEPARTMENT', name: 'Phòng ban', level: 3, color: 'bg-amber-100 text-amber-700' },
];

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all types from database
        let types = await prisma.organizationTypeConfig.findMany({
            where: { deletedAt: null },
            orderBy: [{ level: 'asc' }, { name: 'asc' }],
        });

        // If no types exist, seed with system types
        if (types.length === 0) {
            await prisma.organizationTypeConfig.createMany({
                data: SYSTEM_TYPES.map(t => ({ ...t, isSystem: true })),
            });
            types = await prisma.organizationTypeConfig.findMany({
                where: { deletedAt: null },
                orderBy: [{ level: 'asc' }, { name: 'asc' }],
            });
        }

        return NextResponse.json({ types });
    } catch (error) {
        console.error('Get organization types error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.CREATE, RESOURCES.ORGANIZATION_UNITS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createTypeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { code, name, description, level, color } = validation.data;

        // Check if code already exists
        const existing = await prisma.organizationTypeConfig.findFirst({
            where: { code: code.toUpperCase(), deletedAt: null },
        });

        if (existing) {
            return NextResponse.json({ error: 'Mã loại đơn vị đã tồn tại' }, { status: 409 });
        }

        const newType = await prisma.organizationTypeConfig.create({
            data: {
                code: code.toUpperCase(),
                name,
                description,
                level: level || 0,
                color: color || 'bg-slate-100 text-slate-700',
                isSystem: false,
            },
        });

        return NextResponse.json({ type: newType }, { status: 201 });
    } catch (error) {
        console.error('Create organization type error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.UPDATE, RESOURCES.ORGANIZATION_UNITS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Type ID is required' }, { status: 400 });
        }

        const existingType = await prisma.organizationTypeConfig.findUnique({
            where: { id, deletedAt: null },
        });

        if (!existingType) {
            return NextResponse.json({ error: 'Type not found' }, { status: 404 });
        }

        const body = await request.json();
        const validation = updateTypeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { code, name, description, level, color } = validation.data;

        // Check code uniqueness if changed
        if (code && code.toUpperCase() !== existingType.code) {
            const codeExists = await prisma.organizationTypeConfig.findFirst({
                where: { code: code.toUpperCase(), deletedAt: null, id: { not: id } },
            });
            if (codeExists) {
                return NextResponse.json({ error: 'Mã loại đơn vị đã tồn tại' }, { status: 409 });
            }
        }

        const updated = await prisma.organizationTypeConfig.update({
            where: { id },
            data: {
                ...(code && { code: code.toUpperCase() }),
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(level !== undefined && { level }),
                ...(color && { color }),
            },
        });

        return NextResponse.json({ type: updated });
    } catch (error) {
        console.error('Update organization type error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.DELETE, RESOURCES.ORGANIZATION_UNITS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Type ID is required' }, { status: 400 });
        }

        const existingType = await prisma.organizationTypeConfig.findUnique({
            where: { id, deletedAt: null },
        });

        if (!existingType) {
            return NextResponse.json({ error: 'Type not found' }, { status: 404 });
        }

        // Cannot delete system types
        if (existingType.isSystem) {
            return NextResponse.json(
                { error: 'Không thể xóa loại đơn vị hệ thống' },
                { status: 400 }
            );
        }

        // Soft delete
        await prisma.organizationTypeConfig.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete organization type error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
