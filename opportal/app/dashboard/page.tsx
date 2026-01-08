'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, StatusBadge } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import {
    Users,
    Calendar,
    ClipboardCheck,
    Target,
    TrendingUp,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    color: 'blue' | 'emerald' | 'amber' | 'purple';
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: StatCardProps) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
                        {trend && (
                            <p className={`text-sm mt-2 flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                <TrendingUp className={`h-4 w-4 ${!trendUp && 'rotate-180'}`} />
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = React.useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/dashboard');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const renderAdminDashboard = () => (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Tổng nhân viên"
                    value={(stats as Record<string, Record<string, number>>)?.overview?.totalUsers || 0}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Đang hoạt động"
                    value={(stats as Record<string, Record<string, number>>)?.overview?.activeUsers || 0}
                    icon={CheckCircle}
                    color="emerald"
                />
                <StatCard
                    title="Ca làm việc"
                    value={(stats as Record<string, Record<string, number>>)?.overview?.totalShifts || 0}
                    icon={Calendar}
                    color="amber"
                />
                <StatCard
                    title="Đơn vị tổ chức"
                    value={(stats as Record<string, Record<string, number>>)?.overview?.organizationUnits || 0}
                    icon={Target}
                    color="purple"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 text-blue-600" />
                            Chấm công hôm nay
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900">
                            {(stats as Record<string, Record<string, number>>)?.attendance?.today || 0}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">nhân viên đã chấm công</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            Chờ phê duyệt
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900">
                            {(stats as Record<string, Record<string, number>>)?.approvals?.pending || 0}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">yêu cầu đang chờ</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-emerald-600" />
                            KPI đang thực hiện
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900">
                            {(stats as Record<string, Record<string, number>>)?.kpi?.active || 0}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">KPI đang hoạt động</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );

    const renderUserDashboard = () => (
        <>
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                    title="Chấm công tháng này"
                    value={(stats as Record<string, Record<string, number>>)?.personal?.monthlyAttendance || 0}
                    icon={ClipboardCheck}
                    color="blue"
                />
                <StatCard
                    title="Ca làm việc sắp tới"
                    value={(stats as Record<string, Record<string, number>>)?.personal?.upcomingShifts || 0}
                    icon={Calendar}
                    color="amber"
                />
                <StatCard
                    title="KPI đang thực hiện"
                    value={(stats as Record<string, Record<string, number>>)?.personal?.activeKPIs || 0}
                    icon={Target}
                    color="emerald"
                />
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Chấm công gần đây</CardTitle>
                </CardHeader>
                <CardContent>
                    {(stats as Record<string, { recentAttendance?: Array<{ id: string; date: string; checkIn?: string; checkOut?: string; status: string }> }>)?.personal?.recentAttendance?.length ? (
                        <div className="space-y-3">
                            {(stats as Record<string, { recentAttendance: Array<{ id: string; date: string; checkIn?: string; checkOut?: string; status: string }> }>).personal.recentAttendance.map((attendance) => (
                                <div
                                    key={attendance.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {new Date(attendance.date).toLocaleDateString('vi-VN')}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {attendance.checkIn
                                                ? new Date(attendance.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                                : '--:--'}
                                            {' - '}
                                            {attendance.checkOut
                                                ? new Date(attendance.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                                : '--:--'}
                                        </p>
                                    </div>
                                    <StatusBadge status={attendance.status} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500">Chưa có dữ liệu chấm công</p>
                    )}
                </CardContent>
            </Card>
        </>
    );

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Xin chào, {user?.name}!
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Đây là tổng quan hoạt động của bạn
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                ) : user?.role === 'Admin' || user?.role === 'Manager' ? (
                    renderAdminDashboard()
                ) : (
                    renderUserDashboard()
                )}
            </div>
        </MainLayout>
    );
}
