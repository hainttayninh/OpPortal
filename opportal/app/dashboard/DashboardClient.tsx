'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, Button, StatusBadge } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import {
    Users,
    ClipboardCheck,
    Target,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Bell,
    Clock,
    Plus,
    ChevronRight,
} from 'lucide-react';

interface DashboardStats {
    overview: {
        totalUsers: number;
        activeUsers: number;
        totalShifts: number;
        organizationUnits: number;
    };
    attendance: {
        today: number;
        rate: number;
        onTime: number;
        leave: number;
        lateAbsent: number;
    };
    kpi: {
        active: number;
        avgScore: number;
    };
    approvals: {
        pending: number;
    };
}

// Stat Card Component
function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendUp,
    iconBg = 'bg-blue-100 text-blue-600'
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    iconBg?: string;
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                            <TrendingUp className={`h-3 w-3 ${!trendUp && 'rotate-180'}`} />
                            {trend}
                        </div>
                    )}
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{value}</span>
                    {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
                </div>
            </CardContent>
        </Card>
    );
}

// Donut Chart Component
function AttendanceDonut({ rate, onTime, leave, lateAbsent }: { rate: number; onTime: number; leave: number; lateAbsent: number }) {
    const circumference = 2 * Math.PI * 45;
    const filled = (rate / 100) * circumference;

    return (
        <Card className="h-full">
            <CardContent className="p-5">
                <h3 className="font-semibold text-slate-800 mb-4">Tỷ lệ đi làm</h3>

                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <svg width="140" height="140" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="8"
                                strokeDasharray={`${filled} ${circumference}`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-900">{rate}%</span>
                            <span className="text-xs text-slate-500">Có mặt</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            <span className="text-sm text-slate-600">Đi làm đúng giờ</span>
                        </div>
                        <span className="font-semibold text-slate-800">{onTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                            <span className="text-sm text-slate-600">Nghỉ phép</span>
                        </div>
                        <span className="font-semibold text-slate-800">{leave}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="text-sm text-slate-600">Vắng/Trễ</span>
                        </div>
                        <span className="font-semibold text-slate-800">{lateAbsent}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// KPI Bar Chart Component  
function KPIChart() {
    const data = [
        { name: 'BCVH 01', met: 75, excellent: 15, needImprove: 10 },
        { name: 'BCVH 02', met: 60, excellent: 25, needImprove: 15 },
        { name: 'BCVH 03', met: 80, excellent: 10, needImprove: 10 },
        { name: 'BCVH 04', met: 70, excellent: 20, needImprove: 10 },
        { name: 'BCVH 05', met: 65, excellent: 20, needImprove: 15 },
    ];

    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-800">So sánh KPI các Bưu cục (BCVH)</h3>
                        <p className="text-xs text-slate-500">Hiệu suất hoạt động tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                    </div>
                    <button className="text-sm text-blue-600 hover:underline">Xem báo cáo đầy đủ</button>
                </div>

                <div className="h-48 flex items-end justify-between gap-4 px-4">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col-reverse" style={{ height: '160px' }}>
                                <div
                                    className="w-full bg-red-200 rounded-t-sm transition-all"
                                    style={{ height: `${item.needImprove}%` }}
                                    title="Cần cải thiện"
                                />
                                <div
                                    className="w-full bg-emerald-400"
                                    style={{ height: `${item.excellent}%` }}
                                    title="Xuất sắc"
                                />
                                <div
                                    className="w-full bg-blue-400 rounded-t-md"
                                    style={{ height: `${item.met}%` }}
                                    title="Đạt chỉ tiêu"
                                />
                            </div>
                            <span className="text-xs text-slate-500 mt-2">{item.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                        <span className="text-xs text-slate-600">Đạt chỉ tiêu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                        <span className="text-xs text-slate-600">Xuất sắc</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-200"></span>
                        <span className="text-xs text-slate-600">Cần cải thiện</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Urgent Tasks Component
function UrgentTasks() {
    const tasks = [
        { id: '1', title: '5 KPI nhân viên chờ chốt', subtitle: 'Deadline: 17:00 Hôm nay', action: 'Duyệt ngay', icon: Target, color: 'text-blue-600 bg-blue-100' },
        { id: '2', title: '3 Tờ trình phê duyệt quá hạn', subtitle: 'Trễ 2 ngày', action: 'Xem chi tiết', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
        { id: '3', title: 'Đánh giá thử việc - Nguyễn V...', subtitle: 'Phòng Kỹ thuật', action: 'Đánh giá', icon: Users, color: 'text-amber-600 bg-amber-100' },
    ];

    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h3 className="font-semibold text-slate-800">Việc cần xử lý gấp</h3>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                        {tasks.length} Tác vụ
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="p-4 bg-slate-50 rounded-xl">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${task.color} mb-3`}>
                                <task.icon className="h-5 w-5" />
                            </div>
                            <p className="font-medium text-slate-800 text-sm mb-1 line-clamp-1">{task.title}</p>
                            <p className="text-xs text-slate-500 mb-3">{task.subtitle}</p>
                            <Button variant="outline" size="sm" className="w-full">
                                {task.action}
                            </Button>
                        </div>
                    ))}
                </div>

                <button className="w-full text-center text-sm text-slate-500 hover:text-blue-600 mt-4">
                    Xem tất cả tác vụ
                </button>
            </CardContent>
        </Card>
    );
}

// Announcements Component
function Announcements() {
    const announcements = [
        { id: '1', title: 'Quyết định điều chỉnh lương cơ bản...', author: 'Ban Giám Đốc', time: '2 giờ trước' },
        { id: '2', title: 'Lịch nghỉ lễ Quốc Khánh 2/9', author: 'HCNS', time: '1 ngày trước' },
        { id: '3', title: 'Báo cáo tài chính Quý 3', author: 'Tài chính', time: '3 ngày trước' },
    ];

    return (
        <Card className="h-full">
            <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">Thông báo nội bộ</h3>
                </div>

                <div className="space-y-3">
                    {announcements.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                            <p className="font-medium text-slate-800 text-sm line-clamp-1">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.author} • {item.time}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardClient() {
    const { user } = useAuthStore();
    const [stats, setStats] = React.useState<DashboardStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currentTime, setCurrentTime] = React.useState(new Date());

    // Update time every minute
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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

    // Default stats for display
    const displayStats = {
        totalUsers: stats?.overview?.totalUsers || 200,
        attendanceRate: stats?.attendance?.rate || 98.5,
        kpiScore: stats?.kpi?.avgScore || 85,
        bonus: 1.2,
        onTime: stats?.attendance?.onTime || 184,
        leave: stats?.attendance?.leave || 10,
        lateAbsent: stats?.attendance?.lateAbsent || 6,
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bảng Điều Hành Tổng Quan</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Cập nhật: {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, Hôm nay
                        </p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4" />
                        Tạo yêu cầu mới
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <StatCard
                                title="Tổng nhân sự"
                                value={displayStats.totalUsers}
                                icon={Users}
                                trend="+5 nv"
                                trendUp={true}
                                iconBg="bg-blue-100 text-blue-600"
                            />
                            <StatCard
                                title="Tỷ lệ chấm công"
                                value={`${displayStats.attendanceRate}%`}
                                icon={ClipboardCheck}
                                trend="+2.1%"
                                trendUp={true}
                                iconBg="bg-emerald-100 text-emerald-600"
                            />
                            <StatCard
                                title="KPI Trung tâm"
                                value={`${displayStats.kpiScore}%`}
                                subtitle="Đạt"
                                icon={Target}
                                trend="+1.5%"
                                trendUp={true}
                                iconBg="bg-amber-100 text-amber-600"
                            />
                            <StatCard
                                title="Dự kiến quỹ thưởng"
                                value={`${displayStats.bonus} Tỷ`}
                                icon={DollarSign}
                                iconBg="bg-purple-100 text-purple-600"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="col-span-3">
                                <KPIChart />
                            </div>
                            <div className="col-span-1">
                                <AttendanceDonut
                                    rate={92}
                                    onTime={displayStats.onTime}
                                    leave={displayStats.leave}
                                    lateAbsent={displayStats.lateAbsent}
                                />
                            </div>
                        </div>

                        {/* Urgent Tasks & Announcements */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="col-span-3">
                                <UrgentTasks />
                            </div>
                            <div className="col-span-1">
                                <Announcements />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}
