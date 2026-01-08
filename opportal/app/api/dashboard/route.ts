import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission, ACTIONS, RESOURCES } from '@/lib/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session, ACTIONS.VIEW, RESOURCES.DASHBOARD)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Get statistics based on role
        let stats = {};

        if (session.role === 'Admin' || session.role === 'Manager') {
            // Full statistics for Admin/Manager
            const [
                totalUsers,
                activeUsers,
                totalShifts,
                todayAttendance,
                monthlyAttendance,
                pendingApprovals,
                activeKPIs,
                orgUnits,
            ] = await Promise.all([
                prisma.user.count({ where: { deletedAt: null } }),
                prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
                prisma.shift.count({ where: { deletedAt: null } }),
                prisma.attendance.count({ where: { date: today } }),
                prisma.attendance.count({
                    where: { date: { gte: startOfMonth, lte: endOfMonth } },
                }),
                prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
                prisma.kPI.count({
                    where: { status: { in: ['IN_PROGRESS', 'SUBMITTED', 'APPROVED'] } },
                }),
                prisma.organizationUnit.count({ where: { deletedAt: null } }),
            ]);

            // Attendance trend for the last 7 days
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                last7Days.push(date);
            }

            const attendanceTrend = await Promise.all(
                last7Days.map(async (date) => {
                    const nextDate = new Date(date);
                    nextDate.setDate(nextDate.getDate() + 1);
                    const count = await prisma.attendance.count({
                        where: { date: { gte: date, lt: nextDate } },
                    });
                    return {
                        date: date.toISOString().split('T')[0],
                        count,
                    };
                })
            );

            stats = {
                overview: {
                    totalUsers,
                    activeUsers,
                    totalShifts,
                    organizationUnits: orgUnits,
                },
                attendance: {
                    today: todayAttendance,
                    monthly: monthlyAttendance,
                    trend: attendanceTrend,
                },
                approvals: {
                    pending: pendingApprovals,
                },
                kpi: {
                    active: activeKPIs,
                },
            };
        } else if (session.role === 'Leader') {
            // Limited statistics for Leader (BCVH scope)
            const [
                teamUsers,
                todayTeamAttendance,
                pendingApprovals,
                teamKPIs,
            ] = await Promise.all([
                prisma.user.count({
                    where: { deletedAt: null, organizationUnitId: session.organizationUnitId },
                }),
                prisma.attendance.count({
                    where: {
                        date: today,
                        user: { organizationUnitId: session.organizationUnitId },
                    },
                }),
                prisma.approvalRequest.count({
                    where: {
                        status: 'PENDING',
                        requester: { organizationUnitId: session.organizationUnitId },
                    },
                }),
                prisma.kPI.count({
                    where: {
                        user: { organizationUnitId: session.organizationUnitId },
                        status: { in: ['IN_PROGRESS', 'SUBMITTED'] },
                    },
                }),
            ]);

            stats = {
                team: {
                    totalMembers: teamUsers,
                    todayAttendance: todayTeamAttendance,
                },
                approvals: {
                    pending: pendingApprovals,
                },
                kpi: {
                    active: teamKPIs,
                },
            };
        } else {
            // Personal statistics for User
            const [
                myMonthlyAttendance,
                myActiveKPIs,
                myShiftAssignments,
            ] = await Promise.all([
                prisma.attendance.count({
                    where: {
                        userId: session.userId,
                        date: { gte: startOfMonth, lte: endOfMonth },
                    },
                }),
                prisma.kPI.count({
                    where: {
                        userId: session.userId,
                        status: { in: ['IN_PROGRESS', 'SUBMITTED', 'APPROVED'] },
                    },
                }),
                prisma.shiftAssignment.count({
                    where: {
                        userId: session.userId,
                        date: { gte: today },
                    },
                }),
            ]);

            // Get recent attendance
            const recentAttendance = await prisma.attendance.findMany({
                where: { userId: session.userId },
                orderBy: { date: 'desc' },
                take: 7,
                include: {
                    shiftAssignment: {
                        include: { shift: { select: { name: true, startTime: true, endTime: true } } },
                    },
                },
            });

            stats = {
                personal: {
                    monthlyAttendance: myMonthlyAttendance,
                    activeKPIs: myActiveKPIs,
                    upcomingShifts: myShiftAssignments,
                    recentAttendance,
                },
            };
        }

        return NextResponse.json({ stats, role: session.role });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
