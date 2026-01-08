'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Table,
    Pagination,
    StatusBadge,
    type Column,
} from '@/components/ui';
import { ClipboardCheck, Clock, CheckCircle, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

interface Attendance {
    id: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    workingMinutes: number;
    status: string;
    notes: string | null;
    user: { id: string; name: string; email: string };
    shiftAssignment?: {
        shift: { name: string; startTime: string; endTime: string };
    };
}

export default function AttendancePage() {
    const { user: currentUser } = useAuthStore();
    const [attendances, setAttendances] = React.useState<Attendance[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [checkingIn, setCheckingIn] = React.useState(false);
    const [todayAttendance, setTodayAttendance] = React.useState<Attendance | null>(null);

    const fetchAttendances = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            const response = await fetch(`/api/attendance?${params}`);
            if (response.ok) {
                const data = await response.json();
                setAttendances(data.attendances);
                setPagination((prev) => ({ ...prev, ...data.pagination }));

                // Check if there's attendance for today
                const today = new Date().toISOString().split('T')[0];
                const todayRecord = data.attendances.find(
                    (a: Attendance) => a.date.split('T')[0] === today && a.user.id === currentUser?.id
                );
                setTodayAttendance(todayRecord || null);
            }
        } catch (error) {
            console.error('Failed to fetch attendances:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, currentUser?.id]);

    React.useEffect(() => {
        fetchAttendances();
    }, [fetchAttendances]);

    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: today,
                    checkIn: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                fetchAttendances();
            }
        } catch (error) {
            console.error('Check-in failed:', error);
        } finally {
            setCheckingIn(false);
        }
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const columns: Column<Attendance>[] = [
        {
            key: 'date',
            header: 'Ngày',
            render: (attendance) => new Date(attendance.date).toLocaleDateString('vi-VN'),
        },
        {
            key: 'user',
            header: 'Nhân viên',
            render: (attendance) => attendance.user.name,
        },
        {
            key: 'shift',
            header: 'Ca làm việc',
            render: (attendance) =>
                attendance.shiftAssignment
                    ? `${attendance.shiftAssignment.shift.name} (${attendance.shiftAssignment.shift.startTime} - ${attendance.shiftAssignment.shift.endTime})`
                    : '-',
        },
        {
            key: 'checkIn',
            header: 'Giờ vào',
            render: (attendance) => formatTime(attendance.checkIn),
        },
        {
            key: 'checkOut',
            header: 'Giờ ra',
            render: (attendance) => formatTime(attendance.checkOut),
        },
        {
            key: 'workingMinutes',
            header: 'Thời gian làm',
            render: (attendance) => formatMinutes(attendance.workingMinutes),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (attendance) => <StatusBadge status={attendance.status} />,
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Chấm công</h1>
                        <p className="text-slate-500 mt-1">Quản lý chấm công hàng ngày</p>
                    </div>
                </div>

                {/* Quick Check-in Card */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium opacity-90">Chấm công hôm nay</h3>
                                    <p className="text-3xl font-bold mt-2">
                                        {new Date().toLocaleDateString('vi-VN', {
                                            weekday: 'long',
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    {todayAttendance && (
                                        <p className="mt-2 opacity-90">
                                            Vào: {formatTime(todayAttendance.checkIn)} | Ra: {formatTime(todayAttendance.checkOut)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {!todayAttendance?.checkIn ? (
                                        <Button
                                            onClick={handleCheckIn}
                                            loading={checkingIn}
                                            className="bg-white text-blue-600 hover:bg-blue-50"
                                        >
                                            <Clock className="h-4 w-4" />
                                            Check In
                                        </Button>
                                    ) : !todayAttendance?.checkOut ? (
                                        <Button className="bg-white text-blue-600 hover:bg-blue-50">
                                            <CheckCircle className="h-4 w-4" />
                                            Check Out
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                                            <Lock className="h-5 w-5" />
                                            <span>Đã hoàn thành</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Đã chấm công</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {attendances.filter((a) => a.status === 'CONFIRMED').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                                    <Clock className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Chờ xác nhận</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {attendances.filter((a) => a.status === 'PENDING').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 text-blue-600" />
                            Lịch sử chấm công
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table
                            columns={columns}
                            data={attendances}
                            keyExtractor={(attendance) => attendance.id}
                            loading={loading}
                            emptyMessage="Chưa có dữ liệu chấm công"
                        />
                        {pagination.totalPages > 1 && (
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
