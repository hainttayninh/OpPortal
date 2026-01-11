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
import { Search, Edit, Trash2, UserPlus, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { UserPermissionsDialog } from './UserPermissionsDialog';

interface User {
    id: string;
    email: string;
    username: string;
    name: string;
    phone?: string;
    jobTitle?: string;
    status: string;
    role: { id: string; name: string };
    organizationUnit: { id: string; code: string; name: string; type: string };
    employeeId?: string;
    contractType?: string;
    createdAt: string;
}

const CONTRACT_TYPES = [
    { value: 'HĐLĐ', label: 'Hợp đồng lao động' },
    { value: 'HĐTK', label: 'Hợp đồng triển khoán' },
    { value: 'CTV', label: 'Cộng tác viên' },
];

// Job title options
const JOB_TITLES = [
    'Giám đốc',
    'Phó Giám đốc',
    'Trưởng phòng',
    'Phó phòng',
    'Chuyên viên',
    'Cán sự',
    'Trưởng Bưu cục',
    'Phó Bưu cục',
    'Tổ trưởng',
    'Tổ phó',
    'Nhân viên Nghiệp vụ',
    'Khai thác viên',
    'Tài xế',
    'Bưu tá',
    'CTV',
] as const;

interface Role {
    id: string;
    name: string;
}

interface OrgUnit {
    id: string;
    code: string;
    name: string;
    type: string;
    parentId?: string;
}

export default function UsersPage() {
    const { confirm, DialogComponent } = useConfirmDialog();
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = React.useState<User[]>([]);
    const [roles, setRoles] = React.useState<Role[]>([]);
    const [orgUnits, setOrgUnits] = React.useState<OrgUnit[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [formData, setFormData] = React.useState({
        email: '',
        username: '',
        password: '',
        name: '',
        phone: '',
        jobTitle: '',
        roleId: '',
        organizationUnitId: '',
        employeeId: '',
        contractType: '',
    });
    const [formError, setFormError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [permissionDialogOpen, setPermissionDialogOpen] = React.useState(false);
    const [selectedUserForPermission, setSelectedUserForPermission] = React.useState<User | null>(null);

    // Cascading Dropdown State
    const [selectedParentUnit, setSelectedParentUnit] = React.useState<string>('');

    // Filter Parent Units (TTVH or Top-level Departments)
    const parentUnits = React.useMemo(() =>
        orgUnits.filter(u => u.type === 'TTVH' || !u.parentId),
        [orgUnits]
    );

    // Filter Child Units based on selection
    const availableChildUnits = React.useMemo(() => {
        if (!selectedParentUnit) return [];
        return orgUnits.filter(u => u.parentId === selectedParentUnit);
    }, [orgUnits, selectedParentUnit]);

    // Filter states
    const [filterTTVH, setFilterTTVH] = React.useState<string>('__all__');
    const [filterBCVH, setFilterBCVH] = React.useState<string>('__all__');

    // Get TTVH list and BCVH list based on selected TTVH
    const ttvhList = React.useMemo(() =>
        orgUnits.filter(u => u.type === 'TTVH'),
        [orgUnits]
    );

    const bcvhList = React.useMemo(() => {
        if (filterTTVH === '__all__') {
            return orgUnits.filter(u => u.type === 'BCVH');
        }
        return orgUnits.filter(u => u.type === 'BCVH' && u.parentId === filterTTVH);
    }, [orgUnits, filterTTVH]);

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(search && { search }),
            });

            // Add organization filter
            if (filterBCVH !== '__all__') {
                params.set('organizationUnitId', filterBCVH);
            } else if (filterTTVH !== '__all__') {
                params.set('organizationUnitId', filterTTVH);
            }

            const response = await fetch(`/api/users?${params}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setPagination((prev) => ({ ...prev, ...data.pagination }));
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, filterTTVH, filterBCVH]);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    React.useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [rolesRes, orgUnitsRes] = await Promise.all([
                    fetch('/api/roles'),
                    fetch('/api/organization-units'),
                ]);
                if (rolesRes.ok) {
                    const data = await rolesRes.json();
                    setRoles(data.roles);
                }
                if (orgUnitsRes.ok) {
                    const data = await orgUnitsRes.json();
                    setOrgUnits(data.organizationUnits);
                }
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            }
        };
        fetchMetadata();
    }, []);

    const handleSubmit = async () => {
        setFormError('');
        setSubmitting(true);

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const body = editingUser
                ? { ...formData, password: formData.password || undefined }
                : formData;

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
            setEditingUser(null);
            setFormData({ email: '', username: '', password: '', name: '', phone: '', jobTitle: '', roleId: '', organizationUnitId: '', employeeId: '', contractType: '' });
            setSelectedParentUnit('');
            fetchUsers();
        } catch (error) {
            setFormError('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            username: user.username,
            password: '',
            name: user.name,
            phone: user.phone || '',
            jobTitle: user.jobTitle || '',
            roleId: user.role.id,
            organizationUnitId: user.organizationUnit.id,
            employeeId: user.employeeId || '',
            contractType: user.contractType || '',
        });

        // Find parent unit
        const currentUnit = orgUnits.find(u => u.id === user.organizationUnit.id);
        if (currentUnit) {
            // If it has a parent, use it. If not (it's top level), use its own ID.
            setSelectedParentUnit(currentUnit.parentId || currentUnit.id);
        }

        setDialogOpen(true);
    };

    const handleDelete = async (user: User) => {
        const confirmed = await confirm({
            title: 'Xác nhận xóa người dùng',
            description: `Bạn có chắc chắn muốn xóa người dùng "${user.name}"? Hành động này không thể hoàn tác.`,
            variant: 'danger',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const columns: Column<User>[] = [
        { key: 'employeeId', header: 'Mã HRM', className: 'w-24' },
        { key: 'name', header: 'Họ tên' },
        { key: 'email', header: 'Email' },
        {
            key: 'contractType',
            header: 'Loại HĐ',
            className: 'w-24',
        },
        {
            key: 'role',
            header: 'Vai trò',
            render: (user) => user.role.name,
        },
        {
            key: 'organizationUnit',
            header: 'Đơn vị',
            render: (user) => user.organizationUnit.name,
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (user) => <StatusBadge status={user.status} />,
        },
        {
            key: 'actions',
            header: '',
            className: 'w-32',
            render: (user) => (
                <div className="flex items-center gap-1">
                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
                        <button
                            onClick={() => {
                                setSelectedUserForPermission(user);
                                setPermissionDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600"
                            title="Phân quyền"
                        >
                            <Shield className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="Sửa"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600"
                        title="Xóa"
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
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
                        <p className="text-slate-500 mt-1">Quản lý tài khoản và phân quyền</p>
                    </div>
                    <Button onClick={() => {
                        setEditingUser(null);
                        setFormData({ email: '', username: '', password: '', name: '', phone: '', jobTitle: '', roleId: '', organizationUnitId: '', employeeId: '', contractType: '' });
                        setSelectedParentUnit('');
                        setDialogOpen(true);
                    }}>
                        <UserPlus className="h-4 w-4" />
                        Thêm người dùng
                    </Button>
                </div>

                <Card>
                    <CardHeader className="border-b border-slate-100">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* TTVH Filter */}
                            <Select
                                value={filterTTVH}
                                onValueChange={(value) => {
                                    setFilterTTVH(value);
                                    setFilterBCVH('__all__'); // Reset BCVH when TTVH changes
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="TTVH" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Tất cả TTVH</SelectItem>
                                    {ttvhList.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* BCVH Filter */}
                            <Select
                                value={filterBCVH}
                                onValueChange={(value) => {
                                    setFilterBCVH(value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="BCVH" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Tất cả BCVH</SelectItem>
                                    {bcvhList.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table
                            columns={columns}
                            data={users}
                            keyExtractor={(user) => user.id}
                            loading={loading}
                            emptyMessage="Chưa có người dùng nào"
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {formError && (
                                <div className="col-span-full p-3 text-sm text-red-600 bg-red-50 rounded-lg">{formError}</div>
                            )}

                            {/* Column 1: Account & Personal Info */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Thông tin tài khoản</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input label="Tên đăng nhập" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                                        <Input
                                            label={editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Vai trò <span className="text-red-500">*</span></label>
                                            <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                                                <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Thông tin cá nhân</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input label="Họ và tên" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                        <Input label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Job Info */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Thông tin công việc</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input label="Mã HRM" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} placeholder="VD: 00057416" />

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Trung tâm / Khối <span className="text-red-500">*</span></label>
                                                <Select
                                                    value={selectedParentUnit}
                                                    onValueChange={(value) => {
                                                        setSelectedParentUnit(value);
                                                        setFormData({ ...formData, organizationUnitId: '' }); // Reset child on parent change
                                                    }}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Chọn TTVH / Khối" /></SelectTrigger>
                                                    <SelectContent>
                                                        {parentUnits.map((unit) => (
                                                            <SelectItem key={unit.id} value={unit.id}>{unit.name} ({unit.type})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Đơn vị trực thuộc <span className="text-red-500">*</span></label>
                                                <Select
                                                    value={formData.organizationUnitId}
                                                    onValueChange={(value) => setFormData({ ...formData, organizationUnitId: value })}
                                                    disabled={!selectedParentUnit}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                                                    <SelectContent>
                                                        {/* Option to select the Parent itself if needed */}
                                                        {parentUnits.find(u => u.id === selectedParentUnit) && (
                                                            <SelectItem value={selectedParentUnit}>
                                                                {parentUnits.find(u => u.id === selectedParentUnit)?.name} (Văn phòng)
                                                            </SelectItem>
                                                        )}
                                                        {availableChildUnits.map((unit) => (
                                                            <SelectItem key={unit.id} value={unit.id}>{unit.name} ({unit.type})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chức vụ</label>
                                                <Select value={formData.jobTitle} onValueChange={(value) => setFormData({ ...formData, jobTitle: value })}>
                                                    <SelectTrigger><SelectValue placeholder="Chọn chức vụ" /></SelectTrigger>
                                                    <SelectContent>
                                                        {JOB_TITLES.map((title) => (
                                                            <SelectItem key={title} value={title}>{title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại HĐ</label>
                                                <Select value={formData.contractType} onValueChange={(value) => setFormData({ ...formData, contractType: value })}>
                                                    <SelectTrigger><SelectValue placeholder="Chọn loại HĐ" /></SelectTrigger>
                                                    <SelectContent>
                                                        {CONTRACT_TYPES.map((type) => (
                                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t bg-gray-50/50 mt-auto">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} loading={submitting}>{editingUser ? 'Cập nhật' : 'Thêm mới'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            {DialogComponent}

            {/* Permission Dialog */}
            {
                selectedUserForPermission && (
                    <UserPermissionsDialog
                        userId={selectedUserForPermission.id}
                        userName={selectedUserForPermission.name}
                        userRole={selectedUserForPermission.role.name}
                        open={permissionDialogOpen}
                        onOpenChange={setPermissionDialogOpen}
                    />
                )
            }
        </MainLayout>
    );
}
