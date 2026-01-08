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
import { Building2, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';

interface OrganizationUnit {
    id: string;
    code: string;
    name: string;
    type: 'TTVH' | 'BCVH' | 'BCP' | 'DEPARTMENT';
    address?: string;
    phone?: string;
    parentId?: string;
    parent?: { id: string; name: string; code: string };
    _count?: { children: number; users: number };
    createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
    TTVH: 'Trung tâm Vận hành',
    BCVH: 'Bưu cục Vận hành',
    BCP: 'Bưu cục Phát',
    DEPARTMENT: 'Phòng ban',
};

const TYPE_COLORS: Record<string, string> = {
    TTVH: 'bg-purple-100 text-purple-700',
    BCVH: 'bg-blue-100 text-blue-700',
    BCP: 'bg-emerald-100 text-emerald-700',
    DEPARTMENT: 'bg-amber-100 text-amber-700',
};

export default function OrganizationClient() {
    const [units, setUnits] = React.useState<OrganizationUnit[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingUnit, setEditingUnit] = React.useState<OrganizationUnit | null>(null);
    const [formData, setFormData] = React.useState({
        code: '',
        name: '',
        type: 'BCVH' as string,
        address: '',
        phone: '',
        parentId: '',
    });
    const [formError, setFormError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const fetchUnits = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/organization-units');
            if (response.ok) {
                const data = await response.json();
                setUnits(data.organizationUnits);
            }
        } catch (error) {
            console.error('Failed to fetch organization units:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleSubmit = async () => {
        setFormError('');
        setSubmitting(true);

        try {
            const url = editingUnit
                ? `/api/organization-units?id=${editingUnit.id}`
                : '/api/organization-units';
            const method = editingUnit ? 'PUT' : 'POST';

            const body = {
                ...formData,
                parentId: formData.parentId || null,
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json();
                setFormError(data.error || 'Có lỗi xảy ra');
                return;
            }

            setDialogOpen(false);
            setEditingUnit(null);
            setFormData({ code: '', name: '', type: 'BCVH', address: '', phone: '', parentId: '' });
            fetchUnits();
        } catch (error) {
            setFormError('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (unit: OrganizationUnit) => {
        setEditingUnit(unit);
        setFormData({
            code: unit.code,
            name: unit.name,
            type: unit.type,
            address: unit.address || '',
            phone: unit.phone || '',
            parentId: unit.parentId || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = async (unit: OrganizationUnit) => {
        if (!confirm(`Xác nhận xóa đơn vị ${unit.name}?`)) return;

        try {
            const response = await fetch(`/api/organization-units?id=${unit.id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchUnits();
            }
        } catch (error) {
            console.error('Failed to delete unit:', error);
        }
    };

    const parentOptions = units.filter(u => u.type !== 'DEPARTMENT');

    const columns: Column<OrganizationUnit>[] = [
        {
            key: 'code',
            header: 'Mã',
            render: (unit) => (
                <span className="font-mono text-sm font-medium text-slate-900">{unit.code}</span>
            ),
        },
        { key: 'name', header: 'Tên đơn vị' },
        {
            key: 'type',
            header: 'Loại',
            render: (unit) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[unit.type]}`}>
                    {TYPE_LABELS[unit.type]}
                </span>
            ),
        },
        {
            key: 'parent',
            header: 'Đơn vị cha',
            render: (unit) => unit.parent ? (
                <div className="flex items-center gap-1 text-sm text-slate-600">
                    <ChevronRight className="h-3 w-3" />
                    {unit.parent.name}
                </div>
            ) : '-',
        },
        {
            key: 'stats',
            header: 'Thống kê',
            render: (unit) => (
                <div className="text-sm text-slate-500">
                    {unit._count?.children || 0} đơn vị con • {unit._count?.users || 0} nhân viên
                </div>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'w-24',
            render: (unit) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(unit)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(unit)}
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
                        <h1 className="text-2xl font-bold text-slate-900">Cơ cấu tổ chức</h1>
                        <p className="text-slate-500 mt-1">Quản lý đơn vị và phân cấp tổ chức</p>
                    </div>
                    <Button onClick={() => {
                        setEditingUnit(null);
                        setFormData({ code: '', name: '', type: 'BCVH', address: '', phone: '', parentId: '' });
                        setDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4" />
                        Thêm đơn vị
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    {['TTVH', 'BCVH', 'BCP', 'DEPARTMENT'].map((type) => (
                        <Card key={type}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${TYPE_COLORS[type]}`}>
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {units.filter(u => u.type === type).length}
                                        </p>
                                        <p className="text-sm text-slate-500">{TYPE_LABELS[type]}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Danh sách đơn vị
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table
                            columns={columns}
                            data={units}
                            keyExtractor={(unit) => unit.id}
                            loading={loading}
                            emptyMessage="Chưa có đơn vị nào"
                        />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingUnit ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{formError}</div>
                        )}
                        <Input
                            label="Mã đơn vị"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="VD: TTVH-HN"
                            required
                        />
                        <Input
                            label="Tên đơn vị"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại đơn vị</label>
                            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TTVH">Trung tâm Vận hành</SelectItem>
                                    <SelectItem value="BCVH">Bưu cục Vận hành</SelectItem>
                                    <SelectItem value="BCP">Bưu cục Phát</SelectItem>
                                    <SelectItem value="DEPARTMENT">Phòng ban</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Đơn vị cha</label>
                            <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                                <SelectTrigger><SelectValue placeholder="Chọn đơn vị cha (nếu có)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Không có</SelectItem>
                                    {parentOptions.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.name} ({TYPE_LABELS[unit.type]})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            label="Địa chỉ"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                        <Input
                            label="Số điện thoại"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} loading={submitting}>{editingUnit ? 'Cập nhật' : 'Thêm mới'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
