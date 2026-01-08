import { prisma } from '@/lib/prisma';
import { ActionType, Prisma } from '@prisma/client';
import type { TokenPayload } from '@/lib/auth';

export interface AuditLogData {
    action: ActionType;
    entityType: string;
    entityId: string;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an audit log entry
 * This should be called for all Create, Update, Delete, Approve, Lock operations
 */
export async function createAuditLog(
    user: TokenPayload,
    data: AuditLogData
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                actorId: user.userId,
                actorRole: user.role,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                beforeData: data.beforeData as Prisma.InputJsonValue ?? Prisma.JsonNull,
                afterData: data.afterData as Prisma.InputJsonValue ?? Prisma.JsonNull,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        // Log error but don't throw - audit logging should not break the main operation
        console.error('Failed to create audit log:', error);
    }
}

/**
 * Get the client IP address from request headers
 */
export function getClientIp(headers: Headers): string | undefined {
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return headers.get('x-real-ip') ?? undefined;
}

/**
 * Get the user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
    return headers.get('user-agent') ?? undefined;
}

/**
 * Helper to extract audit info from request
 */
export function getAuditInfo(headers: Headers): { ipAddress?: string; userAgent?: string } {
    return {
        ipAddress: getClientIp(headers),
        userAgent: getUserAgent(headers),
    };
}
