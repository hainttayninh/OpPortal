'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, Button, StatusBadge } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import {
    Users,
    Calendar,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Filter,
    Download,
    TrendingUp,
    Clock,
    CalendarDays,
    UserCheck,
    UserX,
    ChevronRight,
} from 'lucide-react';

// Stat Card
function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendUp,
    iconBg,
    subtitleColor = 'text-slate-500',
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    iconBg: string;
    subtitleColor?: string;
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-slate-500">{title}</p>
                        <p className="text-4xl font-bold text-slate-900 mt-1">{value}</p>
                        {trend && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-emerald-600' : 'text-slate-500'}`}>
                                <TrendingUp className={`h-4 w-4 ${!trendUp && 'rotate-180'}`} />
                                {trend}
                            </div>
                        )}
                        {subtitle && !trend && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${subtitleColor}`}>
                                <CheckCircle className="h-4 w-4" />
                                {subtitle}
                            </div>
                        )}
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Empty Shifts Table
function EmptyShiftsTable() {
    const shifts = [
        { id: '1', position: 'Thu ngân - Cửa hàng 1', area: 'Khu vực Hà Nội', shift: 'Ca 2 (14:00 - 22:00)', missing: 1, status: 'critical' },
        { id: '2', position: 'Kho vận - Nhập hàng', area: 'Kho trung tâm', shift: 'Ca hành chính', missing: 2, status: 'critical' },
        { id: '3', position: 'CSKH - Hotline', area: 'Văn phòng chính', shift: 'Ca đêm (22:00 - 06:00)', missing: 0, status: 'warning' },
    ];

    return (
        <Card>
            <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-slate-800">Cảnh báo: Ca làm trống</h3>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                        {shifts.length} Vị trí
                    </span>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Vị trí</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Ca làm việc</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.map((shift) => (
                            <tr key={shift.id} className="border-t border-slate-50">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-slate-800">{shift.position}</p>
                                    <p className="text-xs text-slate-500">{shift.area}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">{shift.shift}</td>
                                <td className="px-4 py-3">
                                    {shift.missing > 0 ? (
                                        <span className="flex items-center gap-1 text-sm text-red-600">
                                            <UserX className="h-4 w-4" />
                                            Thiếu {shift.missing} người
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-sm text-amber-600">
                                            <AlertTriangle className="h-4 w-4" />
                                            Nguy cơ thiếu
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <button className="text-sm text-blue-600 hover:underline">
                                        {shift.missing > 0 ? 'Tìm người thay' : 'Kiểm tra lịch'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

// Quick Approve Section
function QuickApprove() {
    const requests = [
        { id: '1', name: 'Nguyễn Văn An', type: 'checkin', description: 'Yêu cầu chấm công bù: 08:05 - 25/10 (Quên check-in)', avatar: '🟢' },
        { id: '2', name: 'Trần Thị Bích', type: 'kpi', description: 'Đăng ký KPI Tháng 11: Nhóm Marketing Online', avatar: '🟣' },
        { id: '3', name: 'Lê Văn Cường', type: 'leave', description: 'Xin nghỉ phép: 26/10 - 27/10 (Việc riêng)', avatar: '🟠' },
    ];

    return (
        <Card>
            <CardContent className="p-0">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Duyệt nhanh yêu cầu</h3>
                </div>

                <div className="divide-y divide-slate-50">
                    {requests.map((req) => (
                        <div key={req.id} className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {req.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800">{req.name}</p>
                                <p className="text-sm text-slate-500 truncate">{req.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {req.type !== 'kpi' && (
                                    <Button variant="outline" size="sm">Từ chối</Button>
                                )}
                                {req.type === 'kpi' && (
                                    <Button variant="outline" size="sm">Chi tiết</Button>
                                )}
                                <Button size="sm">
                                    <CheckCircle className="h-4 w-4" />
                                    Duyệt
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button className="w-full text-center text-sm text-blue-600 hover:underline">
                        Xem tất cả yêu cầu
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

// KPI Progress
function KPIProgress() {
    const kpis = [
        { name: 'Đội ngũ Sales', progress: 85, target: '2.5 Tỷ VND', color: 'bg-blue-500' },
        { name: 'Bộ phận Hỗ trợ (CS)', progress: 92, target: 'Tỷ lệ hài lòng: 4.8/5.0', color: 'bg-emerald-500' },
        { name: 'Vận hành Kho & Giao vận', progress: 60, target: 'Đơn hoàn thành đúng hạn', color: 'bg-amber-500' },
        { name: 'Nhân sự & Tuyển dụng', progress: 45, target: 'Tuyển dụng vị trí mới', color: 'bg-purple-500' },
    ];

    return (
        <Card className="h-full">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Tiến độ KPI Tháng {new Date().getMonth() + 1}</h3>
                    <button className="text-slate-400 hover:text-slate-600">•••</button>
                </div>

                <div className="space-y-5">
                    {kpis.map((kpi, idx) => (
                        <div key={idx}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{kpi.name}</span>
                                <span className="text-sm font-bold text-slate-800">{kpi.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${kpi.color} rounded-full transition-all`}
                                    style={{ width: `${kpi.progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{kpi.target}</p>
                        </div>
                    ))}
                </div>

                <Button variant="outline" className="w-full mt-4">
                    Xem chi tiết báo cáo
                </Button>
            </CardContent>
        </Card>
    );
}

// Upcoming Events
function UpcomingEvents() {
    const events = [
        { id: '1', day: '27', weekday: 'T6', title: 'Họp giao ban Quý 4', time: '14:00 - Phòng họp lớn' },
        { id: '2', day: '30', weekday: 'T2', title: 'Đánh giá nhân sự mới', time: '09:00 - Online' },
    ];

    return (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white h-fit">
            <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="h-5 w-5 text-blue-400" />
                    <h3 className="font-semibold">Sự kiện sắp tới</h3>
                </div>

                <div className="space-y-3">
                    {events.map((event) => (
                        <div key={event.id} className="flex items-start gap-4 p-3 bg-white/10 rounded-lg">
                            <div className="text-center flex-shrink-0">
                                <div className="text-xs text-slate-400">{event.weekday}</div>
                                <div className="text-2xl font-bold">{event.day}</div>
                            </div>
                            <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm text-slate-400">{event.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function OperationsClient() {
    const { user } = useAuthStore();
    const [currentDate] = React.useState(new Date());

    // Check role access
    const hasAccess = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Leader';

    if (!hasAccess) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <XCircle className="h-16 w-16 text-red-400 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-800">Không có quyền truy cập</h2>
                    <p className="text-slate-500 mt-2">Trang này chỉ dành cho Admin, Manager và Leader.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bảng Điều Phối Vận Hành</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            {currentDate.toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline">
                            <Filter className="h-4 w-4" />
                            Bộ lọc
                        </Button>
                        <Button>
                            <Download className="h-4 w-4" />
                            Xuất báo cáo ngày
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        title="Đang làm việc"
                        value={185}
                        icon={UserCheck}
                        trend="+2 nhân sự so với hôm qua"
                        trendUp={true}
                        iconBg="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        title="Nghỉ có phép"
                        value={12}
                        icon={Calendar}
                        subtitle="Đúng theo kế hoạch"
                        iconBg="bg-amber-100 text-amber-600"
                    />
                    <StatCard
                        title="Vắng mặt (Cần chú ý)"
                        value={3}
                        icon={UserX}
                        subtitle="Chưa báo cáo lý do"
                        subtitleColor="text-red-500"
                        iconBg="bg-red-100 text-red-600"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Empty Shifts & Quick Approve */}
                    <div className="col-span-2 space-y-6">
                        <EmptyShiftsTable />
                        <QuickApprove />
                    </div>

                    {/* Right Column - KPI & Events */}
                    <div className="col-span-1 space-y-6">
                        <KPIProgress />
                        <UpcomingEvents />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
