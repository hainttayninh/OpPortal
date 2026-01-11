import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES, getScopeFilter } from '@/lib/auth';
import { createAuditLog, getAuditInfo } from '@/lib/audit';
import { ActionType } from '@prisma/client';
import { z } from 'zod';

const createOrgUnitSchema = z.object({
    code: z.string().min(2, 'Code must be at least 2 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.enum(['TTVH', 'BCVH', 'BCP', 'DEPARTMENT']),
    parentId: z.string().optional().nullable(),
    address: z.string().optional(),
    phone: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
});

const updateOrgUnitSchema = createOrgUnitSchema.partial();

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.ORGANIZATION_UNITS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const parentId = searchParams.get('parentId');
        const tree = searchParams.get('tree') === 'true';

        // Get scope filter
        const scopeFilter = getScopeFilter(session);

        let where = {
            deletedAt: null,
            ...(type ? { type: type as 'TTVH' | 'BCVH' | 'BCP' | 'DEPARTMENT' } : {}),
            ...(parentId ? { parentId } : {}),
        };

        // Apply scope filter for non-admin users
        if (scopeFilter.organizationUnitId && session.role !== 'Admin') {
            where = {
                ...where,
                OR: [
                    { id: scopeFilter.organizationUnitId },
                    { parentId: scopeFilter.organizationUnitId },
                ],
            } as typeof where;
        }

        if (tree) {
            // Return hierarchical tree structure
            // Admin sees all, others see filtered
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let treeWhere: any = { deletedAt: null };

            if (session.role !== 'Admin' && scopeFilter.organizationUnitId) {
                treeWhere = {
                    ...treeWhere,
                    OR: [
                        { id: scopeFilter.organizationUnitId },
                        { parentId: scopeFilter.organizationUnitId },
                    ],
                };
            }

            const allUnits = await prisma.organizationUnit.findMany({
                where: session.role === 'Admin' ? { deletedAt: null } : treeWhere,
                include: {
                    parent: { select: { id: true, code: true, name: true, type: true } },
                    _count: { select: { children: true, users: true } },
                },
                orderBy: [{ type: 'asc' }, { name: 'asc' }],
            });

            // Build tree structure
            const buildTree = (units: typeof allUnits, parentId: string | null = null): unknown[] => {
                return units
                    .filter((unit) => unit.parentId === parentId)
                    .map((unit) => ({
                        ...unit,
                        children: buildTree(units, unit.id),
                    }));
            };

            const tree = buildTree(allUnits);
            return NextResponse.json({ organizationUnits: tree });
        }

        const units = await prisma.organizationUnit.findMany({
            where,
            select: {
                id: true,
                code: true,
                name: true,
                type: true,
                parentId: true,
                latitude: true,
                longitude: true,
                address: true,
                phone: true,
                createdAt: true,
                parent: { select: { id: true, code: true, name: true, type: true } },
                _count: { select: { children: true, users: true } },
            },
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });

        return NextResponse.json({ organizationUnits: units });
    } catch (error) {
        console.error('Get organization units error:', error);
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
        const validation = createOrgUnitSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { code, name, type, parentId, address, phone, latitude, longitude } = validation.data;

        // Check if code already exists
        const existingUnit = await prisma.organizationUnit.findFirst({
            where: { code, deletedAt: null },
        });

        if (existingUnit) {
            return NextResponse.json({ error: 'Organization code already exists' }, { status: 409 });
        }

        // Validate parent hierarchy
        if (parentId) {
            const parent = await prisma.organizationUnit.findUnique({
                where: { id: parentId, deletedAt: null },
            });

            if (!parent) {
                return NextResponse.json({ error: 'Parent organization unit not found' }, { status: 404 });
            }

            // Validate type hierarchy: TTVH > BCVH > BCP > DEPARTMENT
            const typeOrder = { TTVH: 0, BCVH: 1, BCP: 2, DEPARTMENT: 3 };
            if (typeOrder[type] <= typeOrder[parent.type]) {
                return NextResponse.json(
                    { error: `${type} cannot be a child of ${parent.type}` },
                    { status: 400 }
                );
            }
        } else if (type !== 'TTVH') {
            return NextResponse.json(
                { error: 'Only TTVH can be a root organization unit' },
                { status: 400 }
            );
        }

        const unit = await prisma.organizationUnit.create({
            data: { code, name, type, parentId, address, phone, latitude, longitude },
            include: {
                parent: { select: { id: true, code: true, name: true, type: true } },
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.CREATE,
            entityType: 'OrganizationUnit',
            entityId: unit.id,
            afterData: { code, name, type, parentId },
            ...auditInfo,
        });

        return NextResponse.json({ organizationUnit: unit }, { status: 201 });
    } catch (error) {
        console.error('Create organization unit error:', error);
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
            return NextResponse.json({ error: 'Organization unit ID is required' }, { status: 400 });
        }

        const existingUnit = await prisma.organizationUnit.findUnique({
            where: { id, deletedAt: null },
        });

        if (!existingUnit) {
            return NextResponse.json({ error: 'Organization unit not found' }, { status: 404 });
        }

        const body = await request.json();
        const validation = updateOrgUnitSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { code, name, type, parentId, address, phone, latitude, longitude } = validation.data;

        // Check if code already exists (if changing)
        if (code && code !== existingUnit.code) {
            const codeExists = await prisma.organizationUnit.findFirst({
                where: { code, deletedAt: null, id: { not: id } },
            });
            if (codeExists) {
                return NextResponse.json({ error: 'Organization code already exists' }, { status: 409 });
            }
        }

        const unit = await prisma.organizationUnit.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(type && { type }),
                ...(parentId !== undefined && { parentId }),
                ...(address !== undefined && { address }),
                ...(phone !== undefined && { phone }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
            },
            include: {
                parent: { select: { id: true, code: true, name: true, type: true } },
                _count: { select: { children: true, users: true } },
            },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.UPDATE,
            entityType: 'OrganizationUnit',
            entityId: unit.id,
            beforeData: { code: existingUnit.code, name: existingUnit.name },
            afterData: { code: unit.code, name: unit.name },
            ...auditInfo,
        });

        return NextResponse.json({ organizationUnit: unit });
    } catch (error) {
        console.error('Update organization unit error:', error);
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
            return NextResponse.json({ error: 'Organization unit ID is required' }, { status: 400 });
        }

        const unit = await prisma.organizationUnit.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: { select: { children: true, users: true } },
            },
        });

        if (!unit) {
            return NextResponse.json({ error: 'Organization unit not found' }, { status: 404 });
        }

        // Check if has children or users
        if (unit._count.children > 0) {
            return NextResponse.json(
                { error: 'Cannot delete organization unit with child units' },
                { status: 400 }
            );
        }

        if (unit._count.users > 0) {
            return NextResponse.json(
                { error: 'Cannot delete organization unit with assigned users' },
                { status: 400 }
            );
        }

        // Soft delete
        await prisma.organizationUnit.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Audit log
        const auditInfo = getAuditInfo(request.headers);
        await createAuditLog(session, {
            action: ActionType.DELETE,
            entityType: 'OrganizationUnit',
            entityId: id,
            beforeData: { code: unit.code, name: unit.name },
            ...auditInfo,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete organization unit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

