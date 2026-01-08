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
    type Column,
} from '@/components/ui';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface User {
    id: string;
    email: string;
    username: string;
    name: string;
    phone?: string;
    status: string;
    role: { id: string; name: string };
    organizationUnit: { id: string; code: string; name: string; type: string };
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
}

interface OrgUnit {
    id: string;
    code: string;
    name: string;
    type: string;
}

export default function UsersPage() {
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
        roleId: '',
        organizationUnitId: '',
    });
    const [formError, setFormError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(search && { search }),
            });
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
    }, [pagination.page, pagination.limit, search]);

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
            setFormData({ email: '', username: '', password: '', name: '', phone: '', roleId: '', organizationUnitId: '' });
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
            roleId: user.role.id,
            organizationUnitId: user.organizationUnit.id,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Xác nhận xóa người dùng ${user.name}?`)) return;

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
        { key: 'name', header: 'Họ tên' },
        { key: 'email', header: 'Email' },
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
            className: 'w-24',
            render: (user) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(user)}
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
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
                        <p className="text-slate-500 mt-1">Quản lý tài khoản và phân quyền</p>
                    </div>
                    <Button onClick={() => { setEditingUser(null); setFormData({ email: '', username: '', password: '', name: '', phone: '', roleId: '', organizationUnitId: '' }); setDialogOpen(true); }}>
                        <UserPlus className="h-4 w-4" />
                        Thêm người dùng
                    </Button>
                </div>

                <Card>
                    <CardHeader className="border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{formError}</div>
                        )}
                        <Input label="Họ tên" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        <Input label="Tên đăng nhập" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                        <Input label={editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} />
                        <Input label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Vai trò</label>
                            <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                                <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Đơn vị</label>
                            <Select value={formData.organizationUnitId} onValueChange={(value) => setFormData({ ...formData, organizationUnitId: value })}>
                                <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                                <SelectContent>
                                    {orgUnits.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>{unit.name} ({unit.type})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} loading={submitting}>{editingUser ? 'Cập nhật' : 'Thêm mới'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
