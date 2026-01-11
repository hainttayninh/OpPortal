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
    useConfirmDialog,
    type Column,
} from '@/components/ui';
import { Target, Plus, Edit, Trash2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface KPIItem {
    id: string;
    description: string;
    weight: number;
    target: string;
    actualValue?: string;
    score?: number;
}

interface KPI {
    id: string;
    title: string;
    type: 'ASSIGNED' | 'SELF_REGISTERED';
    period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    startDate: string;
    endDate: string;
    status: string;
    notes?: string;
    user: { id: string; name: string; email: string };
    items: KPIItem[];
    createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
    ASSIGNED: 'Được giao',
    SELF_REGISTERED: 'Tự đăng ký',
};

const PERIOD_LABELS: Record<string, string> = {
    WEEKLY: 'Tuần',
    MONTHLY: 'Tháng',
    QUARTERLY: 'Quý',
};

export default function KPIClient() {
    const { confirm, DialogComponent } = useConfirmDialog();
    const [kpis, setKpis] = React.useState<KPI[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingKPI, setEditingKPI] = React.useState<KPI | null>(null);
    const [formData, setFormData] = React.useState({
        title: '',
        type: 'ASSIGNED' as string,
        period: 'MONTHLY' as string,
        startDate: '',
        endDate: '',
        notes: '',
        items: [{ description: '', weight: 0, target: '' }] as { description: string; weight: number; target: string }[],
    });
    const [formError, setFormError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const fetchKPIs = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/kpi');
            if (response.ok) {
                const data = await response.json();
                setKpis(data.kpis);
            }
        } catch (error) {
            console.error('Failed to fetch KPIs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchKPIs();
    }, [fetchKPIs]);

    const handleSubmit = async () => {
        setFormError('');

        // Validate total weight = 100%
        const totalWeight = formData.items.reduce((acc, item) => acc + item.weight, 0);
        if (totalWeight !== 100) {
            setFormError(`Tổng trọng số phải bằng 100% (hiện tại: ${totalWeight}%)`);
            return;
        }

        setSubmitting(true);

        try {
            const url = editingKPI
                ? `/api/kpi?id=${editingKPI.id}`
                : '/api/kpi';
            const method = editingKPI ? 'PUT' : 'POST';

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
            setEditingKPI(null);
            resetForm();
            fetchKPIs();
        } catch (error) {
            setFormError('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            type: 'ASSIGNED',
            period: 'MONTHLY',
            startDate: '',
            endDate: '',
            notes: '',
            items: [{ description: '', weight: 0, target: '' }],
        });
    };

    const handleEdit = (kpi: KPI) => {
        setEditingKPI(kpi);
        setFormData({
            title: kpi.title,
            type: kpi.type,
            period: kpi.period,
            startDate: kpi.startDate.split('T')[0],
            endDate: kpi.endDate.split('T')[0],
            notes: kpi.notes || '',
            items: kpi.items.map(item => ({
                description: item.description,
                weight: item.weight,
                target: item.target,
            })),
        });
        setDialogOpen(true);
    };

    const handleDelete = async (kpi: KPI) => {
        const confirmed = await confirm({
            title: 'Xác nhận xóa KPI',
            description: `Bạn có chắc chắn muốn xóa KPI "${kpi.title}"? Hành động này không thể hoàn tác.`,
            variant: 'danger',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/kpi?id=${kpi.id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchKPIs();
            }
        } catch (error) {
            console.error('Failed to delete KPI:', error);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', weight: 0, target: '' }],
        });
    };

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index),
        });
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const totalWeight = formData.items.reduce((acc, item) => acc + item.weight, 0);

    const columns: Column<KPI>[] = [
        {
            key: 'title',
            header: 'Tiêu đề',
            render: (kpi) => (
                <div>
                    <p className="font-medium text-slate-900">{kpi.title}</p>
                    <p className="text-xs text-slate-500">{kpi.items.length} chỉ tiêu</p>
                </div>
            ),
        },
        {
            key: 'user',
            header: 'Nhân viên',
            render: (kpi) => kpi.user.name,
        },
        {
            key: 'type',
            header: 'Loại',
            render: (kpi) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${kpi.type === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                    {TYPE_LABELS[kpi.type]}
                </span>
            ),
        },
        {
            key: 'period',
            header: 'Kỳ',
            render: (kpi) => (
                <div className="flex items-center gap-1 text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>{PERIOD_LABELS[kpi.period]}</span>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Thời gian',
            render: (kpi) => (
                <span className="text-sm text-slate-600">
                    {new Date(kpi.startDate).toLocaleDateString('vi-VN')} - {new Date(kpi.endDate).toLocaleDateString('vi-VN')}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (kpi) => <StatusBadge status={kpi.status} />,
        },
        {
            key: 'actions',
            header: '',
            className: 'w-24',
            render: (kpi) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(kpi)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(kpi)}
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
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý KPI</h1>
                        <p className="text-slate-500 mt-1">Thiết lập và theo dõi chỉ tiêu hiệu suất</p>
                    </div>
                    <Button onClick={() => {
                        setEditingKPI(null);
                        resetForm();
                        setDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4" />
                        Thêm KPI
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{kpis.length}</p>
                                    <p className="text-sm text-slate-500">Tổng KPI</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {kpis.filter(k => k.status === 'IN_PROGRESS').length}
                                    </p>
                                    <p className="text-sm text-slate-500">Đang thực hiện</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {kpis.filter(k => k.status === 'PENDING').length}
                                    </p>
                                    <p className="text-sm text-slate-500">Chờ duyệt</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {kpis.filter(k => k.status === 'COMPLETED').length}
                                    </p>
                                    <p className="text-sm text-slate-500">Hoàn thành</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            Danh sách KPI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table
                            columns={columns}
                            data={kpis}
                            keyExtractor={(kpi) => kpi.id}
                            loading={loading}
                            emptyMessage="Chưa có KPI nào"
                        />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingKPI ? 'Chỉnh sửa KPI' : 'Thêm KPI mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{formError}</div>
                        )}

                        <Input
                            label="Tiêu đề KPI"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="VD: KPI Tháng 1/2026"
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại KPI</label>
                                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ASSIGNED">Được giao</SelectItem>
                                        <SelectItem value="SELF_REGISTERED">Tự đăng ký</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kỳ đánh giá</label>
                                <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEEKLY">Tuần</SelectItem>
                                        <SelectItem value="MONTHLY">Tháng</SelectItem>
                                        <SelectItem value="QUARTERLY">Quý</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Ngày bắt đầu"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                            <Input
                                label="Ngày kết thúc"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Các chỉ tiêu (Tổng: {totalWeight}%)
                                </label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="h-3 w-3" />
                                    Thêm chỉ tiêu
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg">
                                        <div className="col-span-5">
                                            <input
                                                type="text"
                                                placeholder="Mô tả chỉ tiêu"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                placeholder="Trọng số %"
                                                value={item.weight || ''}
                                                onChange={(e) => updateItem(index, 'weight', parseInt(e.target.value) || 0)}
                                                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                placeholder="Mục tiêu"
                                                value={item.target}
                                                onChange={(e) => updateItem(index, 'target', e.target.value)}
                                                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm"
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center">
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 rounded hover:bg-red-100 text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalWeight !== 100 && (
                                <p className="text-sm text-amber-600 mt-2">
                                    ⚠️ Tổng trọng số phải bằng 100%
                                </p>
                            )}
                        </div>

                        <Input
                            label="Ghi chú"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} loading={submitting}>{editingKPI ? 'Cập nhật' : 'Thêm mới'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            {DialogComponent}
        </MainLayout>
    );
}
