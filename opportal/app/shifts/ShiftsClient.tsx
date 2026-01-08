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
    StatusBadge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type Column,
} from '@/components/ui';
import { Clock, Plus, Edit, Trash2, Users } from 'lucide-react';

interface Shift {
    id: string;
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    description?: string;
    status: string;
    organizationUnit: { id: string; name: string; code: string };
    _count?: { assignments: number };
    createdAt: string;
}

interface OrgUnit {
    id: string;
    code: string;
    name: string;
}

export default function ShiftsClient() {
    const [shifts, setShifts] = React.useState<Shift[]>([]);
    const [orgUnits, setOrgUnits] = React.useState<OrgUnit[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingShift, setEditingShift] = React.useState<Shift | null>(null);
    const [formData, setFormData] = React.useState({
        code: '',
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        description: '',
        organizationUnitId: '',
    });
    const [formError, setFormError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const fetchShifts = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/shifts');
            if (response.ok) {
                const data = await response.json();
                setShifts(data.shifts);
            }
        } catch (error) {
            console.error('Failed to fetch shifts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchShifts();
        // Fetch org units for the form
        fetch('/api/organization-units')
            .then(res => res.json())
            .then(data => setOrgUnits(data.organizationUnits || []))
            .catch(console.error);
    }, [fetchShifts]);

    const handleSubmit = async () => {
        setFormError('');
        setSubmitting(true);

        try {
            const url = editingShift
                ? `/api/shifts?id=${editingShift.id}`
                : '/api/shifts';
            const method = editingShift ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                setFormError(data.error || 'Có lỗi xảy ra');
                return;
            }

            setDialogOpen(false);
            setEditingShift(null);
            setFormData({ code: '', name: '', startTime: '08:00', endTime: '17:00', breakMinutes: 60, description: '', organizationUnitId: '' });
            fetchShifts();
        } catch (error) {
            setFormError('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (shift: Shift) => {
        setEditingShift(shift);
        setFormData({
            code: shift.code,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            breakMinutes: shift.breakMinutes,
            description: shift.description || '',
            organizationUnitId: shift.organizationUnit.id,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (shift: Shift) => {
        if (!confirm(`Xác nhận xóa ca làm việc ${shift.name}?`)) return;

        try {
            const response = await fetch(`/api/shifts?id=${shift.id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchShifts();
            }
        } catch (error) {
            console.error('Failed to delete shift:', error);
        }
    };

    const calculateWorkingHours = (start: string, end: string, breakMins: number) => {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const totalMins = (endH * 60 + endM) - (startH * 60 + startM) - breakMins;
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    };

    const columns: Column<Shift>[] = [
        {
            key: 'code',
            header: 'Mã ca',
            render: (shift) => (
                <span className="font-mono text-sm font-medium text-slate-900">{shift.code}</span>
            ),
        },
        { key: 'name', header: 'Tên ca' },
        {
            key: 'time',
            header: 'Thời gian',
            render: (shift) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
                </div>
            ),
        },
        {
            key: 'duration',
            header: 'Thời lượng',
            render: (shift) => (
                <span className="text-slate-600">
                    {calculateWorkingHours(shift.startTime, shift.endTime, shift.breakMinutes)}
                </span>
            ),
        },
        {
            key: 'organizationUnit',
            header: 'Đơn vị',
            render: (shift) => shift.organizationUnit.name,
        },
        {
            key: 'assignments',
            header: 'Phân công',
            render: (shift) => (
                <div className="flex items-center gap-1 text-slate-600">
                    <Users className="h-4 w-4" />
                    <span>{shift._count?.assignments || 0}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (shift) => <StatusBadge status={shift.status} />,
        },
        {
            key: 'actions',
            header: '',
            className: 'w-24',
            render: (shift) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(shift)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(shift)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý ca làm việc</h1>
                        <p className="text-slate-500 mt-1">Thiết lập và quản lý các ca làm việc</p>
                    </div>
                    <Button onClick={() => {
                        setEditingShift(null);
                        setFormData({ code: '', name: '', startTime: '08:00', endTime: '17:00', breakMinutes: 60, description: '', organizationUnitId: '' });
                        setDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4" />
                        Thêm ca làm việc
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{shifts.length}</p>
                                    <p className="text-sm text-slate-500">Tổng số ca</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {shifts.filter(s => s.status === 'ACTIVE').length}
                                    </p>
                                    <p className="text-sm text-slate-500">Đang hoạt động</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {shifts.reduce((acc, s) => acc + (s._count?.assignments || 0), 0)}
                                    </p>
                                    <p className="text-sm text-slate-500">Tổng phân công</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            Danh sách ca làm việc
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table
                            columns={columns}
                            data={shifts}
                            keyExtractor={(shift) => shift.id}
                            loading={loading}
                            emptyMessage="Chưa có ca làm việc nào"
                        />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingShift ? 'Chỉnh sửa ca làm việc' : 'Thêm ca làm việc mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{formError}</div>
                        )}
                        <Input
                            label="Mã ca"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="VD: CA-S1"
                            required
                        />
                        <Input
                            label="Tên ca"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Ca sáng"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Giờ bắt đầu"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                required
                            />
                            <Input
                                label="Giờ kết thúc"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                required
                            />
                        </div>
                        <Input
                            label="Thời gian nghỉ (phút)"
                            type="number"
                            value={formData.breakMinutes.toString()}
                            onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Đơn vị áp dụng</label>
                            <Select value={formData.organizationUnitId} onValueChange={(value) => setFormData({ ...formData, organizationUnitId: value })}>
                                <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                                <SelectContent>
                                    {orgUnits.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            label="Mô tả"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} loading={submitting}>{editingShift ? 'Cập nhật' : 'Thêm mới'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
