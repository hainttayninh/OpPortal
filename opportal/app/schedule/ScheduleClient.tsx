'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import {
    Card,
    CardContent,
    Button,
    StatusBadge,
} from '@/components/ui';
import {
    Clock, Users, AlertCircle, ChevronLeft, ChevronRight,
    Lock, Unlock, Filter, Download, Check, X
} from 'lucide-react';

// Types
interface Employee {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    jobTitle?: string;
}

interface ShiftAssignment {
    id: string;
    date: string;
    userId: string;
    shift: {
        id: string;
        name: string;
        startTime: string;
        endTime: string;
        color?: string;
    };
    status: string;
}

interface Request {
    id: string;
    type: 'LEAVE' | 'OVERTIME' | 'SWAP';
    userId: string;
    userName: string;
    userAvatar?: string;
    description: string;
    date: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

// Shift colors
const SHIFT_COLORS: Record<string, string> = {
    'Ca sáng': 'bg-blue-50 border-blue-200 text-blue-700',
    'Ca chiều': 'bg-amber-50 border-amber-200 text-amber-700',
    'Ca tối': 'bg-purple-50 border-purple-200 text-purple-700',
    'Regular': 'bg-blue-50 border-blue-200 text-blue-700',
    'Evening': 'bg-amber-50 border-amber-200 text-amber-700',
    'Half Day': 'bg-orange-50 border-orange-200 text-orange-700',
    'OFF': 'bg-slate-100 border-slate-200 text-slate-500',
    'SICK': 'bg-red-50 border-red-200 text-red-600',
};

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function ScheduleClient() {
    const [weekStart, setWeekStart] = React.useState(() => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    });
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [assignments, setAssignments] = React.useState<ShiftAssignment[]>([]);
    const [requests, setRequests] = React.useState<Request[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [weekLocked, setWeekLocked] = React.useState(false);

    // Generate week dates
    const weekDates = React.useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [weekStart]);

    // Fetch data
    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            // Fetch employees
            const empRes = await fetch('/api/users?limit=50');
            if (empRes.ok) {
                const data = await empRes.json();
                setEmployees(data.users || []);
            }

            // Fetch shift assignments for the week
            const startDate = weekStart.toISOString().split('T')[0];
            const endDate = weekDates[6].toISOString().split('T')[0];
            const assignRes = await fetch(`/api/shift-assignments?startDate=${startDate}&endDate=${endDate}`);
            if (assignRes.ok) {
                const data = await assignRes.json();
                setAssignments(data.assignments || []);
            }

            // Fetch pending requests (mock for now)
            setRequests([
                {
                    id: '1',
                    type: 'LEAVE',
                    userId: '1',
                    userName: 'Nguyễn Văn A',
                    description: 'Xin nghỉ phép có lý do',
                    date: new Date().toISOString(),
                    status: 'PENDING',
                    createdAt: new Date().toISOString(),
                },
            ]);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [weekStart, weekDates]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Navigate weeks
    const goToPreviousWeek = () => {
        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() - 7);
        setWeekStart(newStart);
    };

    const goToNextWeek = () => {
        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() + 7);
        setWeekStart(newStart);
    };

    // Get assignment for employee on date
    const getAssignment = (employeeId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return assignments.find(a => a.userId === employeeId && a.date.split('T')[0] === dateStr);
    };

    // Format date range
    const formatDateRange = () => {
        const start = weekDates[0];
        const end = weekDates[6];
        const startStr = start.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
        const endStr = end.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    };

    // Stats
    const totalHours = React.useMemo(() => {
        // Calculate from assignments (mock calculation)
        return assignments.length * 8;
    }, [assignments]);

    const coverage = React.useMemo(() => {
        if (employees.length === 0) return 0;
        const daysWithAssignments = new Set(assignments.map(a => a.date.split('T')[0])).size;
        return Math.round((daysWithAssignments / 7) * 100);
    }, [assignments, employees]);

    const pendingApprovals = requests.filter(r => r.status === 'PENDING').length;

    // Handle request approve/reject
    const handleApproveRequest = async (requestId: string) => {
        // API call to approve
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'APPROVED' as const } : r));
    };

    const handleRejectRequest = async (requestId: string) => {
        // API call to reject
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'REJECTED' as const } : r));
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lịch làm việc & Chấm công</h1>
                        <p className="text-slate-500 mt-1">Quản lý phân ca và xác nhận giờ làm việc</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${weekLocked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {weekLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            <span className="text-sm font-medium">
                                {weekLocked ? 'Tuần đã khóa' : 'Tuần chưa khóa'}
                            </span>
                        </div>
                        <Button onClick={() => setWeekLocked(!weekLocked)}>
                            {weekLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            {weekLocked ? 'Mở khóa' : 'Khóa tuần'}
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 uppercase font-medium">Tổng giờ làm</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{totalHours}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 uppercase font-medium">Độ phủ</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{coverage}%</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 uppercase font-medium">Chờ duyệt</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{pendingApprovals}</p>
                                    {pendingApprovals > 0 && (
                                        <p className="text-xs text-amber-600 mt-1">Cần xử lý</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-4 gap-6">
                    {/* Schedule Grid */}
                    <div className="col-span-3">
                        {/* Week Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={goToPreviousWeek}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <ChevronLeft className="h-5 w-5 text-slate-600" />
                                </button>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg">
                                    <span className="font-medium text-slate-800">{formatDateRange()}</span>
                                </div>
                                <button
                                    onClick={goToNextWeek}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <ChevronRight className="h-5 w-5 text-slate-600" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4" />
                                    Lọc
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4" />
                                    Xuất
                                </Button>
                            </div>
                        </div>

                        {/* Grid */}
                        <Card>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-400">Đang tải...</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase bg-slate-50 sticky left-0 min-w-[180px]">
                                                        Nhân viên
                                                    </th>
                                                    {weekDates.map((date, idx) => (
                                                        <th key={idx} className="text-center px-2 py-3 text-xs font-medium text-slate-500 uppercase bg-slate-50 min-w-[100px]">
                                                            <div>{DAYS_VI[(idx + 1) % 7]}</div>
                                                            <div className="text-slate-400 font-normal">{date.getDate()}</div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employees.slice(0, 10).map((employee) => (
                                                    <tr key={employee.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 sticky left-0 bg-white">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                                                    {employee.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-800 text-sm">{employee.name}</p>
                                                                    <p className="text-xs text-slate-400">{employee.jobTitle || employee.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {weekDates.map((date, idx) => {
                                                            const assignment = getAssignment(employee.id, date);
                                                            const isWeekend = idx === 5 || idx === 6;

                                                            return (
                                                                <td key={idx} className={`px-2 py-2 text-center ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                                                                    {assignment ? (
                                                                        <div className={`inline-flex flex-col px-2 py-1.5 rounded-lg border ${SHIFT_COLORS[assignment.shift.name] || 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                                            <span className="text-xs font-medium">
                                                                                {assignment.shift.startTime} - {assignment.shift.endTime}
                                                                            </span>
                                                                            <span className="text-[10px] opacity-75">{assignment.shift.name}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-300 text-xs">—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Requests Panel */}
                    <div className="col-span-1">
                        <Card className="sticky top-4">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                    <h3 className="font-semibold text-slate-800">Yêu cầu</h3>
                                    {pendingApprovals > 0 && (
                                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                            {pendingApprovals}
                                        </span>
                                    )}
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-slate-100 px-4">
                                    <button className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                                        Tất cả
                                    </button>
                                    <button className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">
                                        Nghỉ phép
                                    </button>
                                    <button className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">
                                        Tăng ca
                                    </button>
                                </div>

                                {/* Request List */}
                                <div className="max-h-[500px] overflow-y-auto">
                                    {requests.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">Không có yêu cầu</p>
                                        </div>
                                    ) : (
                                        requests.map((request) => (
                                            <div key={request.id} className="p-4 border-b border-slate-50">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                                        {request.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-slate-800 text-sm">{request.userName}</p>
                                                            <StatusBadge status={request.status} />
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                        <p className="text-sm text-slate-600 mt-2">{request.description}</p>

                                                        {request.status === 'PENDING' && (
                                                            <div className="flex gap-2 mt-3">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApproveRequest(request.id)}
                                                                    className="flex-1"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                    Duyệt
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleRejectRequest(request.id)}
                                                                    className="flex-1"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Từ chối
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
