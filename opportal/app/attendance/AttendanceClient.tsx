'use client';

import React from 'react';
import { toast } from "sonner";
import XLSX from 'xlsx-js-style';
import { MainLayout } from '@/components/layout';
import {
    Card,
    CardContent,
    Button,
    StatusBadge,
} from '@/components/ui';
import {
    Clock, MapPin, LogIn, LogOut, History, ChevronRight, CheckCircle, AlertCircle,
    Calendar, TrendingUp, Bell, FileText, Briefcase, DollarSign, Fingerprint, Eye, ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

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

interface TodayShift {
    id: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    location?: string;
}

// Tab Cá nhân (Personal) - The current check-in/out content
function PersonalTab({
    currentTime,
    currentUser,
    todayAttendance,
    todayShift,
    hasCheckedIn,
    hasCheckedOut,
    checkingIn,
    checkingOut,
    handleCheckIn,
    handleCheckOut,
    getSessionDuration,
    formatTime,
    attendances,
    loading,
}: {
    currentTime: Date;
    currentUser: { name?: string } | null;
    todayAttendance: Attendance | null;
    todayShift: TodayShift | null;
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    checkingIn: boolean;
    checkingOut: boolean;
    handleCheckIn: () => void;
    handleCheckOut: () => void;
    getSessionDuration: () => string | null;
    formatTime: (s: string | null) => string;
    attendances: Attendance[];
    loading: boolean;
}) {
    return (
        <div className="space-y-6">
            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
                {/* Check-in Card */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Fingerprint className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-slate-800">Chấm công hôm nay</h3>
                            </div>
                            <StatusBadge status={hasCheckedIn ? 'Đúng giờ' : 'Chờ'} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-slate-50 rounded-lg text-center">
                                <p className="text-xs text-slate-400 uppercase">Giờ vào</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">
                                    {hasCheckedIn ? formatTime(todayAttendance?.checkIn || null).split(':').slice(0, 2).join(':') : '--:--'}
                                </p>
                                <p className="text-xs text-slate-400">{hasCheckedIn ? 'AM' : ''}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg text-center">
                                <p className="text-xs text-slate-400 uppercase">Giờ ra</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">
                                    {hasCheckedOut ? formatTime(todayAttendance?.checkOut || null).split(':').slice(0, 2).join(':') : '--:--'}
                                </p>
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            onClick={hasCheckedIn && !hasCheckedOut ? handleCheckOut : handleCheckIn}
                            loading={checkingIn || checkingOut}
                            disabled={(hasCheckedIn && hasCheckedOut) || checkingIn || checkingOut}
                        >
                            <Fingerprint className="h-4 w-4" />
                            {hasCheckedIn && !hasCheckedOut ? 'Chấm công ra' : 'Chấm công nhanh'}
                        </Button>

                        <p className="text-xs text-slate-400 text-center mt-3">
                            Ca làm việc: {todayShift ? `${todayShift.startTime} - ${todayShift.endTime}` : '08:00 - 17:30'}
                        </p>
                    </CardContent>
                </Card>

                {/* Work Calendar */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-slate-800">Lịch làm việc</h3>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">Tuần</button>
                                <button className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-full">Tháng</button>
                            </div>
                        </div>

                        {/* Week days */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-3">
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
                                <div key={day} className="text-xs text-slate-400">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {[22, 23, 24, 25, 26, 27, 28].map((day, idx) => {
                                const isToday = day === new Date().getDate();
                                const isWeekend = idx >= 5;
                                return (
                                    <div
                                        key={day}
                                        className={`py-2 rounded-lg text-sm font-medium relative
                                            ${isToday ? 'bg-blue-600 text-white' : isWeekend ? 'text-slate-400 bg-slate-50' : 'text-slate-700 hover:bg-slate-100'}
                                        `}
                                    >
                                        {day}
                                        {!isWeekend && !isToday && (
                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Today's events */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-400 uppercase mb-3">Hôm nay</p>
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <span className="text-xs text-slate-400 w-12">09:00</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            <span className="text-sm font-medium text-slate-700">Họp giao ban đầu tuần</span>
                                        </div>
                                        <p className="text-xs text-slate-400 ml-4">Phòng họp A1 • Team Tech</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-xs text-slate-400 w-12">14:30</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                            <span className="text-sm font-medium text-slate-700">Review thiết kế UI/UX</span>
                                        </div>
                                        <p className="text-xs text-slate-400 ml-4">Online • Google Meet</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Notifications */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-red-500" />
                                    <h3 className="font-semibold text-slate-800">Thông báo</h3>
                                </div>
                                <button className="text-xs text-blue-600 hover:underline">Xem tất cả</button>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded">QUAN TRỌNG</span>
                                        <span className="text-xs text-slate-400">2 giờ trước</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">Cập nhật chính sách nghỉ lễ 30/4 - 1/5</p>
                                    <p className="text-xs text-slate-500 mt-1">Ban lãnh đạo thông báo lịch nghỉ lễ...</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded">TIN MỚI</span>
                                        <span className="text-xs text-slate-400">Hôm qua</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">Chào đón nhân sự mới tháng 4</p>
                                    <p className="text-xs text-slate-500 mt-1">Công ty hân hoan chào đón 05 thành viên...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <CardContent className="p-5">
                            <h3 className="font-semibold mb-4">Tiện ích nhanh</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-4 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-colors">
                                    <Briefcase className="h-6 w-6 mx-auto mb-2" />
                                    <span className="text-sm">Xin nghỉ phép</span>
                                </button>
                                <button className="p-4 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-colors">
                                    <Clock className="h-6 w-6 mx-auto mb-2" />
                                    <span className="text-sm">Đăng ký OT</span>
                                </button>
                            </div>
                            <button className="w-full mt-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-colors flex items-center justify-center gap-2">
                                <FileText className="h-5 w-5" />
                                <span className="text-sm">Xem phiếu lương</span>
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-6">
                {/* KPI Cá nhân */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                <h3 className="font-semibold text-slate-800">KPI Cá nhân</h3>
                            </div>
                            <button className="text-slate-400">•••</button>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Tiến độ Tháng {new Date().getMonth() + 1}</span>
                                <span className="text-sm font-bold text-slate-800">75%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Thu nhập ước tính */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                <h3 className="font-semibold text-slate-800">Thu nhập ước tính</h3>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <Eye className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">15.450.000 <span className="text-sm font-normal text-slate-500">VND</span></p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Tab Bảng công (Timesheet) - Monthly Grid View
function TimesheetTab() {
    const [selectedMonth, setSelectedMonth] = React.useState(new Date());
    const [loading, setLoading] = React.useState(false);

    // Data state
    const [monthAttendances, setMonthAttendances] = React.useState<any[]>([]);
    const [allUnits, setAllUnits] = React.useState<{ id: string; name: string; type: string; parentId: string | null }[]>([]);
    const [allEmployees, setAllEmployees] = React.useState<{ id: string; employeeId: string; name: string; organizationUnitId: string | null; organizationUnit?: { id: string; name: string; parentId: string | null } }[]>([]);

    // Filters
    const [selectedTTVH, setSelectedTTVH] = React.useState<string>('');
    const [selectedBCVH, setSelectedBCVH] = React.useState<string>('');

    // Fetch attendances for selected month
    React.useEffect(() => {
        const fetchAttendances = async () => {
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth();
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            try {
                const response = await fetch(`/api/attendance?startDate=${startDate}&endDate=${endDate}&limit=2000`);
                if (response.ok) {
                    const data = await response.json();
                    setMonthAttendances(data.attendances || []);
                }
            } catch (error) {
                console.error('Failed to fetch attendances:', error);
            }
        };
        fetchAttendances();
    }, [selectedMonth]);

    // Fetch organization units
    React.useEffect(() => {
        const fetchUnits = async () => {
            try {
                const response = await fetch('/api/organization-units');
                if (response.ok) {
                    const data = await response.json();
                    setAllUnits(data.organizationUnits || []);
                }
            } catch (error) {
                console.error('Failed to fetch units:', error);
            }
        };
        fetchUnits();
    }, []);

    // Fetch employees
    React.useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/users?excludeAdmin=true');
                if (response.ok) {
                    const data = await response.json();
                    setAllEmployees(data.users || []);
                }
            } catch (error) {
                console.error('Failed to fetch employees:', error);
            }
            setLoading(false);
        };
        fetchEmployees();
    }, []);

    // Helper: Colors
    const attendanceTypes = [
        { code: 'X', label: 'Có mặt', color: 'bg-blue-200 text-blue-800' },
        { code: '1/2', label: 'Nửa ngày', color: 'bg-blue-50 text-blue-600' },
        { code: 'NP', label: 'Nghỉ phép', color: 'bg-orange-200 text-orange-800' },
        { code: 'NL', label: 'Nghỉ lễ', color: 'bg-sky-300 text-sky-900' },
        { code: 'NB', label: 'Nghỉ bù', color: 'bg-green-300 text-green-900' },
        { code: 'NO', label: 'Nghỉ ốm', color: 'bg-blue-600 text-white' },
        { code: 'CD', label: 'Công đoàn', color: 'bg-blue-600 text-white' },
        { code: 'TS', label: 'Thai sản', color: 'bg-blue-600 text-white' },
        { code: 'TN', label: 'Tai nạn', color: 'bg-blue-600 text-white' },
        { code: 'HN', label: 'Học nghề', color: 'bg-blue-600 text-white' },
        { code: 'KL', label: 'Không lương', color: 'bg-red-600 text-white' },
    ];

    const getColorForType = (code: string) => {
        const type = attendanceTypes.find(t => t.code === code);
        return type ? type.color : 'bg-gray-100 text-gray-800';
    };

    // Helper: Get Shift/Attendance Code
    const getAttendanceCode = (empId: string, day: number) => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const date = new Date(year, month, day);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const record = monthAttendances.find(a =>
            a.user.id === empId &&
            a.date.startsWith(dateStr)
        );

        if (record) {
            // Priority: Notes > Status
            if (record.notes) {
                const codes = attendanceTypes.map(t => t.code);
                const noteContent = record.notes.split(';').pop()?.trim() || record.notes;

                // Exact match
                if (codes.includes(noteContent)) return { code: noteContent, color: getColorForType(noteContent) };

                // "Chấm công: X" format
                const parts = noteContent.split(':');
                if (parts.length > 1 && codes.includes(parts[1].trim())) {
                    const code = parts[1].trim();
                    return { code, color: getColorForType(code) };
                }
            }
            if (record.status === 'CONFIRMED') return { code: 'X', color: getColorForType('X') };
        }
        return null;
    };

    // Helper: Calculate Total Workdays
    const calculateTotalWork = (empId: string, daysInMonth: number) => {
        let total = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            const att = getAttendanceCode(empId, i);
            if (att) {
                if (att.code === 'X') total += 1;
                else if (att.code === '1/2') total += 0.5;
            }
        }
        return total;
    };

    // Filter Logic
    const filteredEmployees = React.useMemo(() => {
        let filtered = allEmployees;

        if (selectedBCVH) {
            if (selectedBCVH.endsWith('_OFFICE')) {
                const parentId = selectedBCVH.replace('_OFFICE', '');
                filtered = filtered.filter(emp => emp.organizationUnitId === parentId);
            } else {
                const bcpIds = allUnits.filter(u => u.parentId === selectedBCVH).map(u => u.id);
                const validIds = [selectedBCVH, ...bcpIds];
                filtered = filtered.filter(emp => emp.organizationUnitId && validIds.includes(emp.organizationUnitId));
            }
        } else if (selectedTTVH) {
            const bcvhIds = allUnits.filter(u => u.type === 'BCVH' && u.parentId === selectedTTVH).map(u => u.id);
            const bcpIds = allUnits.filter(u => u.parentId && bcvhIds.includes(u.parentId)).map(u => u.id);
            const validIds = [selectedTTVH, ...bcvhIds, ...bcpIds];
            filtered = filtered.filter(emp => emp.organizationUnitId && validIds.includes(emp.organizationUnitId));
        }
        return filtered;
    }, [allEmployees, selectedTTVH, selectedBCVH, allUnits]);

    // Pagination
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 20; // Show more rows for overview
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Days in month
    const getDaysInMonth = () => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const days = [];
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
            const date = new Date(year, month, i);
            days.push({
                day: i,
                weekday: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()],
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
            });
        }
        return days;
    };
    const days = getDaysInMonth();
    const monthStr = selectedMonth.toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Bảng Công Tổng Hợp Tháng {monthStr}</h2>
                    <p className="text-sm text-slate-500">Dữ liệu chấm công toàn bộ nhân viên</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline">
                        <History className="h-4 w-4" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="group flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:border-blue-400 transition-colors bg-white hover:bg-slate-50">
                                    <Calendar className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                    <span className="text-sm font-medium text-slate-700">
                                        Tháng {selectedMonth.getMonth() + 1}/{selectedMonth.getFullYear()}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="start">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => {
                                                const newDate = new Date(selectedMonth);
                                                newDate.setFullYear(selectedMonth.getFullYear() - 1);
                                                setSelectedMonth(newDate);
                                            }}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="font-semibold text-sm">
                                            Năm {selectedMonth.getFullYear()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => {
                                                const newDate = new Date(selectedMonth);
                                                newDate.setFullYear(selectedMonth.getFullYear() + 1);
                                                setSelectedMonth(newDate);
                                            }}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <Button
                                                key={i}
                                                variant={selectedMonth.getMonth() === i ? "default" : "outline"}
                                                size="sm"
                                                className={selectedMonth.getMonth() === i ? "bg-blue-600 hover:bg-blue-700 text-xs" : "text-xs border-slate-200 hover:bg-slate-50 text-slate-700"}
                                                onClick={() => {
                                                    const newDate = new Date(selectedMonth);
                                                    newDate.setMonth(i);
                                                    setSelectedMonth(newDate);
                                                }}
                                            >
                                                Tháng {i + 1}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Unit Filters */}
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedTTVH}
                            onChange={(e) => { setSelectedTTVH(e.target.value); setSelectedBCVH(''); }}
                        >
                            <option value="">Tất cả Trung tâm / Khối</option>
                            {allUnits.filter(u => u.type === 'TTVH').map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedBCVH}
                            onChange={(e) => setSelectedBCVH(e.target.value)}
                            disabled={!selectedTTVH}
                        >
                            <option value="">Tất cả Đơn vị</option>
                            {selectedTTVH && (
                                <option value={`${selectedTTVH}_OFFICE`}>
                                    {allUnits.find(u => u.id === selectedTTVH)?.name} (Văn phòng)
                                </option>
                            )}
                            {allUnits
                                .filter(u => u.type === 'BCVH' && (!selectedTTVH || u.parentId === selectedTTVH))
                                .map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))
                            }
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Grid Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-center px-2 py-3 text-xs font-medium text-slate-500 uppercase sticky left-0 bg-white z-10 w-12 border-r border-slate-100">STT</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase sticky left-12 bg-white z-10 w-24 border-r border-slate-100">Mã HRM</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase sticky left-36 bg-white z-10 w-48 border-r border-slate-100">Họ và tên</th>
                                {days.map((d) => (
                                    <th key={d.day} className={`text-center px-1 py-2 text-xs font-medium uppercase min-w-[36px] border-r border-slate-100 ${d.isWeekend ? 'bg-slate-50 text-slate-400' : 'text-slate-500'}`}>
                                        <div>{d.weekday}</div>
                                        <div className="text-slate-800 font-bold">{d.day.toString().padStart(2, '0')}</div>
                                    </th>
                                ))}
                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase sticky right-0 bg-white z-10 border-l border-slate-100 shadow-sm">Tổng công</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={days.length + 4} className="text-center py-8">Đang tải dữ liệu...</td></tr>
                            ) : paginatedEmployees.length === 0 ? (
                                <tr><td colSpan={days.length + 4} className="text-center py-8">Không có nhân viên nào</td></tr>
                            ) : (
                                paginatedEmployees.map((emp, index) => (
                                    <tr key={emp.id} className="border-t border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer group">
                                        <td className="text-center px-2 py-3 text-sm text-slate-500 sticky left-0 bg-white group-hover:bg-blue-50 transition-colors border-r border-slate-100">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 sticky left-12 bg-white group-hover:bg-blue-50 transition-colors border-r border-slate-100 font-mono">
                                            {emp.employeeId || '-'}
                                        </td>
                                        <td className="px-4 py-3 sticky left-36 bg-white group-hover:bg-blue-50 transition-colors border-r border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800 text-sm whitespace-nowrap">{emp.name}</span>
                                                <span className="text-xs text-slate-400 whitespace-nowrap">{emp.organizationUnit?.name}</span>
                                            </div>
                                        </td>
                                        {days.map((d) => {
                                            const shift = getAttendanceCode(emp.id, d.day);
                                            return (
                                                <td key={d.day} className={`text-center px-1 py-1 border-r border-slate-100 ${d.isWeekend ? 'bg-slate-50/50' : ''}`}>
                                                    {shift ? (
                                                        <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded ${shift.color} min-w-[24px]`}>
                                                            {shift.code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-200 text-xs">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="text-center px-4 py-3 sticky right-0 bg-white group-hover:bg-blue-50 transition-colors border-l border-slate-100 shadow-sm">
                                            <span className="font-bold text-blue-600">{calculateTotalWork(emp.id, days.length)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">Trang {currentPage} / {totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Trước</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Sau</Button>
                </div>
            </div>
        </div>
    );
}

// Tab Chấm công (Attendance Management) - Daily Grid View
function AttendanceManagementTab() {
    const [selectedMonth, setSelectedMonth] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [selectedType, setSelectedType] = React.useState<string>('');
    const [monthAttendances, setMonthAttendances] = React.useState<any[]>([]);

    // Organization units state
    const [allUnits, setAllUnits] = React.useState<{ id: string; name: string; type: string; parentId: string | null }[]>([]);
    const [selectedTTVH, setSelectedTTVH] = React.useState<string>('');
    const [selectedBCVH, setSelectedBCVH] = React.useState<string>('');

    // Employees state
    const [allEmployees, setAllEmployees] = React.useState<{ id: string; employeeId: string; name: string; organizationUnitId: string | null; organizationUnit?: { id: string; name: string; parentId: string | null } }[]>([]);
    const [selectedEmployees, setSelectedEmployees] = React.useState<Set<string>>(new Set());
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    // Fetch attendances for selected month
    React.useEffect(() => {
        const fetchAttendances = async () => {
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth();
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            try {
                const response = await fetch(`/api/attendance?startDate=${startDate}&endDate=${endDate}&limit=1000`);
                if (response.ok) {
                    const data = await response.json();
                    setMonthAttendances(data.attendances || []);
                }
            } catch (error) {
                console.error('Failed to fetch attendances:', error);
            }
        };
        fetchAttendances();
    }, [selectedMonth, saving]); // Refetch when month changes or after saving

    // Fetch organization units
    React.useEffect(() => {
        const fetchUnits = async () => {
            try {
                const response = await fetch('/api/organization-units');
                if (response.ok) {
                    const data = await response.json();
                    setAllUnits(data.organizationUnits || []);
                }
            } catch (error) {
                console.error('Failed to fetch units:', error);
            }
        };
        fetchUnits();
    }, []);

    // Fetch employees
    React.useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/users?excludeAdmin=true');
                if (response.ok) {
                    const data = await response.json();
                    setAllEmployees(data.users || []);
                }
            } catch (error) {
                console.error('Failed to fetch employees:', error);
            }
            setLoading(false);
        };
        fetchEmployees();
    }, []);

    // Filter TTVH units
    const ttvhUnits = allUnits.filter(u => u.type === 'TTVH');

    // Filter BCVH based on selected TTVH
    const bcvhUnits = selectedTTVH
        ? allUnits.filter(u => u.type === 'BCVH' && u.parentId === selectedTTVH)
        : allUnits.filter(u => u.type === 'BCVH');

    // Pagination state
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Filter employees based on selected TTVH and BCVH
    const filteredEmployees = React.useMemo(() => {
        let filtered = allEmployees;

        if (selectedBCVH) {
            // Filter by specific BCVH - include child BCPs
            if (selectedBCVH.endsWith('_OFFICE')) {
                const parentId = selectedBCVH.replace('_OFFICE', '');
                filtered = filtered.filter(emp => emp.organizationUnitId === parentId);
            } else {
                const bcpIds = allUnits.filter(u => u.parentId === selectedBCVH).map(u => u.id);
                const validIds = [selectedBCVH, ...bcpIds];
                filtered = filtered.filter(emp => emp.organizationUnitId && validIds.includes(emp.organizationUnitId));
            }
        } else if (selectedTTVH) {
            // Filter by TTVH - TTVH itself, child BCVHs, and grandchild BCPs
            const bcvhIds = allUnits.filter(u => u.type === 'BCVH' && u.parentId === selectedTTVH).map(u => u.id);
            const bcpIds = allUnits.filter(u => u.parentId && bcvhIds.includes(u.parentId)).map(u => u.id);
            const validIds = [selectedTTVH, ...bcvhIds, ...bcpIds];
            filtered = filtered.filter(emp => emp.organizationUnitId && validIds.includes(emp.organizationUnitId));
        }

        return filtered;
    }, [allEmployees, selectedTTVH, selectedBCVH, allUnits]);

    // Reset pagination when filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedTTVH, selectedBCVH]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Generate days for display
    const getDaysInMonth = () => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const days = [];
        const lastDay = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= lastDay; i++) {
            const date = new Date(year, month, i);
            days.push({
                day: i,
                weekday: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()],
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
            });
        }
        return days;
    };

    const days = getDaysInMonth();

    // Helper to get attendance for employee and date
    const getAttendanceCode = (empId: string, day: number) => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        // Use local time construction to match dateStr
        const date = new Date(year, month, day);
        // Format to YYYY-MM-DD manually to avoid timezone issues with toISOString() in some environments
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const record = monthAttendances.find(a =>
            a.user.id === empId &&
            a.date.startsWith(dateStr)
        );

        if (record) {
            // We stored the type in notes
            if (record.notes) {
                const codes = ['X', '1/2', 'NP', 'NL', 'NB', 'NO', 'CD', 'TS', 'TN', 'HN', 'KL'];
                const noteContent = record.notes.split(';').pop()?.trim() || record.notes;

                // Try to find exact match
                if (codes.includes(noteContent)) return { code: noteContent, color: getColorForType(noteContent) };

                // Try to parse "Chấm công: NP"
                const parts = noteContent.split(':');
                if (parts.length > 1 && codes.includes(parts[1].trim())) {
                    const code = parts[1].trim();
                    return { code, color: getColorForType(code) };
                }
            }
            // Fallback if confirmed but no specific note code found
            if (record.status === 'CONFIRMED') return { code: 'X', color: getColorForType('X') };
        }
        return null;
    };

    const getColorForType = (code: string) => {
        const type = attendanceTypes.find(t => t.code === code);
        return type ? type.color : 'bg-gray-100 text-gray-800';
    };

    // Attendance types
    const attendanceTypes = [
        { code: 'X', label: 'Có mặt', color: 'bg-blue-200 text-blue-800' },
        { code: '1/2', label: 'Nửa ngày', color: 'bg-blue-50 text-blue-600' },
        { code: 'NP', label: 'Nghỉ phép', color: 'bg-orange-200 text-orange-800' },
        { code: 'NL', label: 'Nghỉ lễ', color: 'bg-sky-300 text-sky-900' },
        { code: 'NB', label: 'Nghỉ bù', color: 'bg-green-300 text-green-900' },
        { code: 'NO', label: 'Nghỉ ốm', color: 'bg-blue-600 text-white' },
        { code: 'CD', label: 'Công đoàn', color: 'bg-blue-600 text-white' },
        { code: 'TS', label: 'Thai sản', color: 'bg-blue-600 text-white' },
        { code: 'TN', label: 'Tai nạn', color: 'bg-blue-600 text-white' },
        { code: 'HN', label: 'Học nghề', color: 'bg-blue-600 text-white' },
        { code: 'KL', label: 'Không lương', color: 'bg-red-600 text-white' },
    ];

    const monthStr = `tháng ${selectedMonth.getMonth() + 1} năm ${selectedMonth.getFullYear()}`;

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
        } else {
            setSelectedEmployees(new Set());
        }
    };

    // Handle individual selection
    const handleSelectEmployee = (empId: string, checked: boolean) => {
        const newSet = new Set(selectedEmployees);
        if (checked) {
            newSet.add(empId);
        } else {
            newSet.delete(empId);
        }
        setSelectedEmployees(newSet);
    };

    // Handle Chấm công
    const handleMarkAttendance = async () => {
        if (selectedEmployees.size === 0) {
            toast.error('Vui lòng chọn ít nhất một nhân viên');
            return;
        }
        if (!selectedType) {
            toast.error('Vui lòng chọn loại chấm công');
            return;
        }
        if (!selectedDate) {
            toast.error('Vui lòng chọn ngày chấm công');
            return;
        }

        setSaving(true);
        try {
            const promises = Array.from(selectedEmployees).map(async (userId) => {
                const response = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        date: selectedDate,
                        status: 'CONFIRMED',
                        notes: selectedType,
                    }),
                });
                return response.ok;
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => r).length;

            if (successCount === selectedEmployees.size) {
                toast.success(`Đã chấm công thành công cho ${successCount} nhân viên`);
            } else {
                toast.warning(`Đã chấm công cho ${successCount}/${selectedEmployees.size} nhân viên`);
            }
            setSelectedEmployees(new Set());
        } catch (error) {
            console.error('Failed to mark attendance:', error);
            toast.error('Lỗi khi chấm công');
        }
        setSaving(false);
    };

    // Export Excel
    const handleExportExcel = () => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;
        const lastDay = new Date(year, month, 0).getDate();

        // Headers
        // Added 'STT' at the beginning
        const headers = ['STT', 'Họ và tên', 'Mã HRM'];
        for (let i = 1; i <= lastDay; i++) headers.push(i.toString());
        headers.push('Tổng công', 'Ngày nghỉ', 'Ghi chú', 'CĐ', 'BHXH', 'Tính lương');

        // Data
        const dataRows = filteredEmployees.map((emp, index) => {
            // Added index + 1 for STT
            const row: any[] = [index + 1, emp.name, emp.employeeId || emp.id.slice(0, 8)];
            let totalWork = 0;
            let totalOff = 0;

            for (let i = 1; i <= lastDay; i++) {
                const att = getAttendanceCode(emp.id, i);
                let code = '';
                if (att) {
                    code = att.code;
                    if (code === 'X') totalWork += 1;
                    else if (code === '1/2') totalWork += 0.5;
                    else if (['NP', 'NL', 'NB', 'NO', 'TS', 'CD', 'TN', 'HN', 'KL'].includes(code)) totalOff += 1;
                }
                row.push(code);
            }
            row.push(totalWork, totalOff, '', '', '', '');
            return row;
        });

        // Worksheet Data
        const wsData = [
            ['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
            ['Độc lập - Tự do - Hạnh phúc'],
            [''],
            ['BẢNG CHẤM CÔNG'],
            [`Tháng ${month} năm ${year}`],
            [''],
            headers,
            ...dataRows,
            [''],
            ['Ghi chú:'],
            ['X', 'Đủ công'],
            ['1/2', '1/2 Công'],
            ['NP', 'Nghỉ phép'],
            ['NL', 'Nghỉ lễ'],
            ['NB', 'Nghỉ bù'],
            ['NO', 'Nghỉ ốm'],
            ['CD', 'Nghỉ chế độ'],
            ['TS', 'Nghỉ thai sản'],
            ['TN', 'Nghỉ tai nạn'],
            ['HN', 'Nghỉ (Học/Hội nghị)'],
            ['KL', 'Nghỉ không lương']
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Styling
        const borderStyle = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        const colorMap: Record<string, string> = {
            'X': '9BC2E6',    // Xanh (Light Blue)
            '1/2': 'DDEBF7',  // Xanh lợt
            'NP': 'FFC000',   // Cam
            'NL': '00B0F0',   // Xanh da trời
            'NB': '92D050',   // Xanh lá
            'NO': '0070C0',   // Xanh dương
            'CD': '0070C0',   // Xanh dương
            'TS': '0070C0',   // Xanh dương
            'TN': '0070C0',   // Xanh dương
            'HN': '0070C0',   // Xanh dương
            'KL': 'FF0000'    // Đỏ
        };

        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");
        const dataEndRow = 6 + dataRows.length;

        // Apply styles to all cells
        for (let R = 0; R <= range.e.r; ++R) {
            for (let C = 0; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);

                if (!ws[cell_ref]) continue;

                // Initialize style
                if (!ws[cell_ref].s) ws[cell_ref].s = {};

                // Default Font
                ws[cell_ref].s.font = { name: 'Times New Roman', sz: 11 };

                // Title Rows (0-4)
                if (R <= 4) {
                    ws[cell_ref].s.alignment = { horizontal: 'center', vertical: 'center' };
                    if (R === 0 || R === 3) ws[cell_ref].s.font.bold = true;
                    if (R === 3) ws[cell_ref].s.font.sz = 16;
                    if (R === 4) ws[cell_ref].s.font.italic = true;
                }

                // Header (Row 6)
                else if (R === 6) {
                    ws[cell_ref].s.border = borderStyle;
                    ws[cell_ref].s.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
                    ws[cell_ref].s.font.bold = true;
                    ws[cell_ref].s.fill = { fgColor: { rgb: "FFFF00" } };
                }

                // Data Rows (7 to dataEndRow)
                else if (R > 6 && R <= dataEndRow) {
                    ws[cell_ref].s.border = borderStyle;
                    // Left align Name (Col 1), Center others (STT is Col 0)
                    ws[cell_ref].s.alignment = {
                        horizontal: C === 1 ? 'left' : 'center',
                        vertical: 'center',
                        wrapText: true
                    };

                    // Color Coding
                    const val = ws[cell_ref].v as string;
                    if (colorMap[val]) {
                        ws[cell_ref].s.fill = { fgColor: { rgb: colorMap[val] } };
                        // White text for dark backgrounds
                        if (['NO', 'CD', 'TS', 'TN', 'HN', 'KL', 'NB', 'NL'].includes(val)) {
                            ws[cell_ref].s.font.color = { rgb: "FFFFFF" };
                        }
                    }
                }

                // Notes Section (After data)
                else if (R > dataEndRow) {
                    ws[cell_ref].s.alignment = { horizontal: 'left', vertical: 'center' };
                    if (ws[cell_ref].v === 'Ghi chú:') ws[cell_ref].s.font.bold = true;

                    // Color the code in the notes? Code is in Col 0 (or wherever it falls, actually it is in Col 0 in the array)
                    if (C === 0) {
                        const val = ws[cell_ref].v as string;
                        if (colorMap[val]) {
                            ws[cell_ref].s.fill = { fgColor: { rgb: colorMap[val] } };
                            if (['NO', 'CD', 'TS', 'TN', 'HN', 'KL', 'NB', 'NL'].includes(val)) {
                                ws[cell_ref].s.font.color = { rgb: "FFFFFF" };
                            }
                        }
                    }
                }
            }
        }

        // Merges
        const mergeEndCol = headers.length - 1;
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: mergeEndCol } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: mergeEndCol } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: mergeEndCol } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: mergeEndCol } },
        ];

        // Column Widths
        // Added { wch: 5 } for STT at start
        const wscols = [{ wch: 5 }, { wch: 30 }, { wch: 10 }];
        for (let i = 1; i <= lastDay; i++) wscols.push({ wch: 4 });
        wscols.push({ wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 10 });
        ws['!cols'] = wscols;

        // Clean up merges? No, dynamic mergeEndCol handles it.

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BangChamCong");
        XLSX.writeFile(wb, `BangChamCong_Thang${month}_${year}.xlsx`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Chấm công</h2>
                    <p className="text-sm text-slate-500">Quản lý ngày công nhân viên</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg">
                    <button
                        className="text-slate-400 hover:text-slate-600"
                        onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
                    >
                        &lt;
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-400 uppercase">Tháng</span>
                        <span className="font-semibold text-slate-800">{monthStr}</span>
                    </div>
                    <button
                        className="text-slate-400 hover:text-slate-600"
                        onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
                    >
                        &gt;
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedTTVH}
                    onChange={(e) => {
                        setSelectedTTVH(e.target.value);
                        setSelectedBCVH(''); // Reset BCVH when TTVH changes
                        setSelectedEmployees(new Set()); // Reset selection
                    }}
                >
                    <option value="">Tất cả Đơn vị</option>
                    {ttvhUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                </select>
                <select
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedBCVH}
                    onChange={(e) => {
                        setSelectedBCVH(e.target.value);
                        setSelectedEmployees(new Set()); // Reset selection
                    }}
                >
                    <option value="">Tất cả BCVH</option>
                    {selectedTTVH && (
                        <option value={`${selectedTTVH}_OFFICE`}>
                            {allUnits.find(u => u.id === selectedTTVH)?.name} (Văn phòng)
                        </option>
                    )}
                    {bcvhUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                </select>
                <Button variant="outline">
                    Khóa bảng công
                </Button>
            </div>

            {/* Date picker and attendance types */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Ngày chấm:</span>
                    <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border-none focus:outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {attendanceTypes.map((type) => (
                        <button
                            key={type.code}
                            onClick={() => setSelectedType(type.code)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${selectedType === type.code
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                        >
                            {type.code}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <Button onClick={handleMarkAttendance} disabled={saving || selectedEmployees.size === 0 || !selectedType}>
                        <CheckCircle className="h-4 w-4" />
                        {saving ? 'Đang lưu...' : `Chấm công (${selectedEmployees.size})`}
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel}>
                        <History className="h-4 w-4" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            {/* Grid Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Đang tải danh sách nhân viên...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">Không có nhân viên nào</div>
                    ) : (
                        <table className="w-full min-w-[1200px]">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-center px-2 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300"
                                            checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase sticky left-0 bg-white z-10 min-w-[250px]">Họ và tên</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase w-24">Mã HRM</th>
                                    {days.map((d) => (
                                        <th key={d.day} className={`text-center px-1 py-2 text-xs font-medium uppercase min-w-[32px] ${d.isWeekend ? 'bg-red-50 text-red-400' : 'text-slate-500'
                                            }`}>
                                            <div className="font-bold text-slate-800">{d.day}</div>
                                            <div className={d.isWeekend ? 'text-red-400' : 'text-slate-400'}>{d.weekday}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEmployees.map((emp) => (
                                    <tr key={emp.id} className={`border-t border-slate-50 hover:bg-slate-50/50 ${selectedEmployees.has(emp.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="text-center px-2 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300"
                                                checked={selectedEmployees.has(emp.id)}
                                                onChange={(e) => handleSelectEmployee(emp.id, e.target.checked)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 sticky left-0 bg-white">
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm whitespace-nowrap">{emp.name}</p>
                                                {emp.organizationUnit && <p className="text-xs text-slate-400">{emp.organizationUnit.name}</p>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">{emp.employeeId || emp.id.slice(0, 8)}</td>
                                        {days.map((d) => {
                                            const attendance = getAttendanceCode(emp.id, d.day);
                                            return (
                                                <td key={d.day} className={`text-center px-1 py-2 ${d.isWeekend ? 'bg-red-50/30' : ''
                                                    }`}>
                                                    {attendance ? (
                                                        <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${attendance.color}`}>
                                                            {attendance.code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-200">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} trong tổng số {filteredEmployees.length} nhân viên
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Trước
                            </Button>
                            <span className="text-sm font-medium text-slate-600">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default function AttendancePage() {
    const { user: currentUser } = useAuthStore();
    const [currentTime, setCurrentTime] = React.useState(new Date());
    const [activeTab, setActiveTab] = React.useState<'personal' | 'timesheet' | 'attendance'>('personal');
    const [attendances, setAttendances] = React.useState<Attendance[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [checkingIn, setCheckingIn] = React.useState(false);
    const [checkingOut, setCheckingOut] = React.useState(false);
    const [todayAttendance, setTodayAttendance] = React.useState<Attendance | null>(null);
    const [todayShift, setTodayShift] = React.useState<TodayShift | null>(null);

    // Real-time clock
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch attendance data
    const fetchAttendances = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/attendance?limit=30');
            if (response.ok) {
                const data = await response.json();
                setAttendances(data.attendances || []);
                const today = new Date().toISOString().split('T')[0];
                const todayRecord = (data.attendances || []).find(
                    (a: Attendance) => a.date.split('T')[0] === today && a.user?.id === currentUser?.id
                );
                setTodayAttendance(todayRecord || null);
            }
        } catch (error) {
            console.error('Failed to fetch attendances:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    // Fetch today's shift
    const fetchTodayShift = React.useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/shift-assignments?date=${today}&userId=${currentUser?.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.assignments?.length > 0) {
                    const assignment = data.assignments[0];
                    setTodayShift({
                        id: assignment.id,
                        shiftName: assignment.shift.name,
                        startTime: assignment.shift.startTime,
                        endTime: assignment.shift.endTime,
                        location: assignment.organizationUnit?.name || 'Văn phòng',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch shift:', error);
        }
    }, [currentUser?.id]);

    React.useEffect(() => {
        fetchAttendances();
        fetchTodayShift();
    }, [fetchAttendances, fetchTodayShift]);

    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: today, checkIn: new Date().toISOString() }),
            });
            if (response.ok) fetchAttendances();
        } catch (error) {
            console.error('Check-in failed:', error);
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        if (!todayAttendance) return;
        setCheckingOut(true);
        try {
            const response = await fetch(`/api/attendance?id=${todayAttendance.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkOut: new Date().toISOString() }),
            });
            if (response.ok) fetchAttendances();
        } catch (error) {
            console.error('Check-out failed:', error);
        } finally {
            setCheckingOut(false);
        }
    };

    const getSessionDuration = () => {
        if (!todayAttendance?.checkIn) return null;
        const checkInTime = new Date(todayAttendance.checkIn);
        const now = todayAttendance.checkOut ? new Date(todayAttendance.checkOut) : new Date();
        const diffMs = now.getTime() - checkInTime.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Xin chào';
        if (hour < 18) return 'Xin chào';
        return 'Xin chào';
    };

    const hasCheckedIn = !!todayAttendance?.checkIn;
    const hasCheckedOut = !!todayAttendance?.checkOut;

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            {getGreeting()}, {currentUser?.name || 'Bạn'} 👋
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Chúc bạn một ngày làm việc hiệu quả.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'personal'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Cá nhân
                    </button>
                    <button
                        onClick={() => setActiveTab('timesheet')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'timesheet'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Bảng công
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'attendance'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Chấm công
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'personal' ? (
                    <PersonalTab
                        currentTime={currentTime}
                        currentUser={currentUser}
                        todayAttendance={todayAttendance}
                        todayShift={todayShift}
                        hasCheckedIn={hasCheckedIn}
                        hasCheckedOut={hasCheckedOut}
                        checkingIn={checkingIn}
                        checkingOut={checkingOut}
                        handleCheckIn={handleCheckIn}
                        handleCheckOut={handleCheckOut}
                        getSessionDuration={getSessionDuration}
                        formatTime={formatTime}
                        attendances={attendances}
                        loading={loading}
                    />
                ) : activeTab === 'timesheet' ? (
                    <TimesheetTab />
                ) : (
                    <AttendanceManagementTab />
                )}
            </div>
        </MainLayout>
    );
}
