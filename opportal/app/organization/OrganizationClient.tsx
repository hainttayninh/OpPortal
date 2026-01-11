'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import {
    Card,
    CardContent,
    Button,
    Input,
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
    StatusBadge,
    useConfirmDialog,
} from '@/components/ui';
import {
    Building2, Plus, Edit, Trash2, ChevronRight, ChevronDown,
    Search, Users, Settings, Home, Loader2
} from 'lucide-react';

// Types
interface OrganizationUnit {
    id: string;
    code: string;
    name: string;
    type: string;
    address?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    parentId?: string | null;
    parent?: { id: string; name: string; code: string; type: string } | null;
    _count?: { children: number; users: number };
    children?: OrganizationUnit[];
    createdAt?: string;
}

interface Employee {
    id: string;
    name: string;
    email: string;
    phone?: string;
    jobTitle?: string;
    role: { name: string };
    avatar?: string;
}

// Default fallback labels and colors
const DEFAULT_TYPE_LABELS: Record<string, string> = {
    TTVH: 'Trung tâm Vận hành',
    BCVH: 'Bưu cục Vận hành',
    BCP: 'Bưu cục Phát',
    DEPARTMENT: 'Phòng ban',
};

const DEFAULT_TYPE_COLORS: Record<string, string> = {
    TTVH: 'bg-purple-100 text-purple-700',
    BCVH: 'bg-blue-100 text-blue-700',
    BCP: 'bg-emerald-100 text-emerald-700',
    DEPARTMENT: 'bg-amber-100 text-amber-700',
};

const TYPE_ICONS: Record<string, string> = {
    TTVH: '🏢',
    BCVH: '🏬',
    BCP: '📮',
    DEPARTMENT: '🏛️',
};

// Tree Node Component
function TreeNode({
    unit,
    level = 0,
    selectedId,
    onSelect,
    expandedIds,
    onToggleExpand
}: {
    unit: OrganizationUnit;
    level?: number;
    selectedId: string | null;
    onSelect: (unit: OrganizationUnit) => void;
    expandedIds: Set<string>;
    onToggleExpand: (id: string) => void;
}) {
    const hasChildren = unit.children && unit.children.length > 0;
    const isExpanded = expandedIds.has(unit.id);
    const isSelected = selectedId === unit.id;

    return (
        <div>
            <div
                className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${isSelected
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-slate-100'
                    }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(unit)}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(unit.id); }}
                        className="p-0.5 hover:bg-slate-200 rounded"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                    </button>
                ) : (
                    <span className="w-5" />
                )}
                <span className="text-sm mr-1">{TYPE_ICONS[unit.type] || '📁'}</span>
                <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                    {unit.name}
                </span>
                {unit._count && unit._count.users > 0 && (
                    <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {unit._count.users}
                    </span>
                )}
            </div>
            {hasChildren && isExpanded && (
                <div>
                    {unit.children!.map(child => (
                        <TreeNode
                            key={child.id}
                            unit={child}
                            level={level + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Main Component
export default function OrganizationClient() {
    const { confirm, DialogComponent } = useConfirmDialog();

    // Data state
    const [treeData, setTreeData] = React.useState<OrganizationUnit[]>([]);
    const [flatUnits, setFlatUnits] = React.useState<OrganizationUnit[]>([]);
    const [loading, setLoading] = React.useState(true);

    // UI state
    const [selectedUnit, setSelectedUnit] = React.useState<OrganizationUnit | null>(null);
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<'subunits' | 'employees' | 'permissions'>('subunits');
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [employeesLoading, setEmployeesLoading] = React.useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingUnit, setEditingUnit] = React.useState<OrganizationUnit | null>(null);
    const [parentIdForNew, setParentIdForNew] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        code: '',
        name: '',
        type: 'BCVH' as string,
        address: '',
        phone: '',
        parentId: '__none__',
        latitude: '' as string,
        longitude: '' as string,
    });
    const [formError, setFormError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    // Fetch tree data
    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [treeRes, flatRes] = await Promise.all([
                fetch('/api/organization-units?tree=true'),
                fetch('/api/organization-units'),
            ]);

            if (treeRes.ok) {
                const data = await treeRes.json();
                setTreeData(data.organizationUnits || []);
                // Auto-expand first level
                const firstLevelIds = new Set<string>((data.organizationUnits || []).map((u: OrganizationUnit) => u.id));
                setExpandedIds(firstLevelIds);
            }

            if (flatRes.ok) {
                const data = await flatRes.json();
                setFlatUnits(data.organizationUnits || []);
            }
        } catch (error) {
            console.error('Failed to fetch organization units:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Toggle expand
    const handleToggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Fetch employees for a unit
    const fetchEmployees = React.useCallback(async (unitId: string) => {
        setEmployeesLoading(true);
        try {
            const response = await fetch(`/api/users?organizationUnitId=${unitId}`);
            if (response.ok) {
                const data = await response.json();
                setEmployees(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            setEmployees([]);
        } finally {
            setEmployeesLoading(false);
        }
    }, []);

    // Select unit
    const handleSelectUnit = (unit: OrganizationUnit) => {
        setSelectedUnit(unit);
        setActiveTab('subunits');
        fetchEmployees(unit.id);
    };

    // Get breadcrumb path
    const getBreadcrumb = (unit: OrganizationUnit): OrganizationUnit[] => {
        const path: OrganizationUnit[] = [unit];
        let current = unit;

        while (current.parent) {
            const parent = flatUnits.find(u => u.id === current.parentId);
            if (parent) {
                path.unshift(parent);
                current = parent;
            } else {
                break;
            }
        }

        return path;
    };

    // Get sub-units of selected unit
    const getSubUnits = (parentId: string) => {
        return flatUnits.filter(u => u.parentId === parentId);
    };

    // Get employees of selected unit (placeholder for now)
    const getEmployees = () => {
        return selectedUnit?._count?.users || 0;
    };

    // Handle form submit
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
                parentId: formData.parentId === '__none__' ? null : formData.parentId,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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
            setParentIdForNew(null);
            setFormData({ code: '', name: '', type: 'BCVH', address: '', phone: '', parentId: '__none__', latitude: '', longitude: '' });
            fetchData();
        } catch {
            setFormError('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (unit: OrganizationUnit) => {
        const confirmed = await confirm({
            title: 'Xác nhận xóa đơn vị',
            description: `Bạn có chắc chắn muốn xóa đơn vị "${unit.name}"? Hành động này không thể hoàn tác.`,
            variant: 'danger',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/organization-units?id=${unit.id}`, { method: 'DELETE' });
            if (response.ok) {
                if (selectedUnit?.id === unit.id) {
                    setSelectedUnit(null);
                }
                fetchData();
            }
        } catch (error) {
            console.error('Failed to delete unit:', error);
        }
    };

    // Open add child dialog
    const handleAddChild = (parentUnit: OrganizationUnit) => {
        setEditingUnit(null);
        setParentIdForNew(parentUnit.id);
        setFormData({
            code: '',
            name: '',
            type: parentUnit.type === 'TTVH' ? 'BCVH' : parentUnit.type === 'BCVH' ? 'BCP' : 'DEPARTMENT',
            address: '',
            phone: '',
            parentId: parentUnit.id,
            latitude: '',
            longitude: ''
        });
        setDialogOpen(true);
    };

    // Open edit dialog
    const handleEdit = (unit: OrganizationUnit) => {
        setEditingUnit(unit);
        setParentIdForNew(null);
        setFormData({
            code: unit.code,
            name: unit.name,
            type: unit.type,
            address: unit.address || '',
            phone: unit.phone || '',
            parentId: unit.parentId || '__none__',
            latitude: unit.latitude?.toString() || '',
            longitude: unit.longitude?.toString() || '',
        });
        setDialogOpen(true);
    };

    // Filter tree by search
    const filteredTree = React.useMemo(() => {
        if (!searchQuery.trim()) return treeData;

        const query = searchQuery.toLowerCase();

        const filterNode = (node: OrganizationUnit): OrganizationUnit | null => {
            const matches = node.name.toLowerCase().includes(query) ||
                node.code.toLowerCase().includes(query);

            const filteredChildren = node.children?.map(filterNode).filter(Boolean) as OrganizationUnit[] || [];

            if (matches || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        };

        return treeData.map(filterNode).filter(Boolean) as OrganizationUnit[];
    }, [treeData, searchQuery]);

    const parentOptions = flatUnits.filter(u => u.type !== 'DEPARTMENT');

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)] gap-0">
                {/* Left Sidebar - Tree View */}
                <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="font-semibold text-slate-800 mb-1">Cấu trúc tổ chức</h2>
                        <p className="text-xs text-slate-500">TTVH → BCVH → BCP</p>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm đơn vị..."
                                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tree */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            </div>
                        ) : filteredTree.length === 0 ? (
                            <div className="text-center py-8 text-sm text-slate-400">
                                Không có đơn vị nào
                            </div>
                        ) : (
                            filteredTree.map(unit => (
                                <TreeNode
                                    key={unit.id}
                                    unit={unit}
                                    selectedId={selectedUnit?.id || null}
                                    onSelect={handleSelectUnit}
                                    expandedIds={expandedIds}
                                    onToggleExpand={handleToggleExpand}
                                />
                            ))
                        )}
                    </div>

                    {/* Add Root Button */}
                    <div className="p-3 border-t border-slate-100">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setEditingUnit(null);
                                setParentIdForNew(null);
                                setFormData({ code: '', name: '', type: 'TTVH', address: '', phone: '', parentId: '__none__', latitude: '', longitude: '' });
                                setDialogOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            Thêm đơn vị gốc
                        </Button>
                    </div>
                </div>

                {/* Right Panel - Detail View */}
                <div className="flex-1 bg-slate-50 overflow-y-auto">
                    {!selectedUnit ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Building2 className="h-16 w-16 mb-4 opacity-30" />
                            <p className="text-lg font-medium">Chọn đơn vị từ cây bên trái</p>
                            <p className="text-sm">để xem thông tin chi tiết</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm mb-4">
                                <Home className="h-4 w-4 text-slate-400" />
                                {getBreadcrumb(selectedUnit).map((unit, idx, arr) => (
                                    <React.Fragment key={unit.id}>
                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                        <button
                                            onClick={() => handleSelectUnit(unit)}
                                            className={`hover:text-blue-600 ${idx === arr.length - 1 ? 'text-blue-600 font-medium' : 'text-slate-500'
                                                }`}
                                        >
                                            {unit.name}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-slate-900">{selectedUnit.name}</h1>
                                        <StatusBadge status="ACTIVE" />
                                    </div>
                                    <p className="text-slate-500">
                                        {DEFAULT_TYPE_LABELS[selectedUnit.type] || selectedUnit.type} • {selectedUnit.code}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(selectedUnit)}>
                                        <Trash2 className="h-4 w-4" />
                                        Xóa
                                    </Button>
                                    <Button variant="outline" onClick={() => handleEdit(selectedUnit)}>
                                        <Edit className="h-4 w-4" />
                                        Sửa
                                    </Button>
                                    <Button onClick={() => handleAddChild(selectedUnit)}>
                                        <Plus className="h-4 w-4" />
                                        Thêm đơn vị con
                                    </Button>
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="text-xs font-medium text-slate-500 uppercase mb-3">Thông tin đơn vị</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-400">Mã đơn vị</p>
                                                <p className="font-medium text-slate-800">{selectedUnit.code}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Đơn vị cha</p>
                                                <p className="font-medium text-slate-800">
                                                    {selectedUnit.parent ? (
                                                        <button
                                                            onClick={() => {
                                                                const parent = flatUnits.find(u => u.id === selectedUnit.parentId);
                                                                if (parent) handleSelectUnit(parent);
                                                            }}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {selectedUnit.parent.name}
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </p>
                                            </div>
                                            {selectedUnit.address && (
                                                <div>
                                                    <p className="text-xs text-slate-400">Địa chỉ</p>
                                                    <p className="font-medium text-slate-800">{selectedUnit.address}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="text-xs font-medium text-slate-500 uppercase mb-3">Thống kê</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-slate-600">Đơn vị con</p>
                                                <p className="font-bold text-lg text-slate-800">{selectedUnit._count?.children || 0}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-slate-600">Nhân viên</p>
                                                <p className="font-bold text-lg text-slate-800">{selectedUnit._count?.users || 0}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="text-xs font-medium text-slate-500 uppercase mb-3">Liên hệ</h3>
                                        <div className="space-y-3">
                                            {selectedUnit.phone ? (
                                                <div>
                                                    <p className="text-xs text-slate-400">Điện thoại</p>
                                                    <p className="font-medium text-slate-800">{selectedUnit.phone}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic">Chưa có thông tin liên hệ</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-slate-200 mb-4">
                                <div className="flex gap-6">
                                    <button
                                        onClick={() => setActiveTab('subunits')}
                                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'subunits'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Đơn vị con ({getSubUnits(selectedUnit.id).length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('employees')}
                                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'employees'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Nhân viên ({getEmployees()})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('permissions')}
                                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'permissions'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Quyền
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <Card>
                                <CardContent className="p-4">
                                    {activeTab === 'subunits' && (
                                        <div>
                                            {getSubUnits(selectedUnit.id).length === 0 ? (
                                                <div className="text-center py-8 text-slate-400">
                                                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                    <p>Chưa có đơn vị con</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-3"
                                                        onClick={() => handleAddChild(selectedUnit)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Thêm đơn vị con
                                                    </Button>
                                                </div>
                                            ) : (
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-slate-100">
                                                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Tên</th>
                                                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Loại</th>
                                                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
                                                            <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {getSubUnits(selectedUnit.id).map(sub => (
                                                            <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                                <td className="py-3 px-4">
                                                                    <button
                                                                        onClick={() => handleSelectUnit(sub)}
                                                                        className="flex items-center gap-2 hover:text-blue-600"
                                                                    >
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DEFAULT_TYPE_COLORS[sub.type]}`}>
                                                                            {TYPE_ICONS[sub.type]}
                                                                        </span>
                                                                        <div>
                                                                            <p className="font-medium text-slate-800">{sub.name}</p>
                                                                            <p className="text-xs text-slate-400">{sub.code}</p>
                                                                        </div>
                                                                    </button>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${DEFAULT_TYPE_COLORS[sub.type]}`}>
                                                                        {DEFAULT_TYPE_LABELS[sub.type] || sub.type}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-slate-600">
                                                                    {sub._count?.users || 0} người
                                                                </td>
                                                                <td className="py-3 px-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button
                                                                            onClick={() => handleEdit(sub)}
                                                                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(sub)}
                                                                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'employees' && (
                                        <div>
                                            {employeesLoading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                                </div>
                                            ) : employees.length === 0 ? (
                                                <div className="text-center py-8 text-slate-400">
                                                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                    <p>Chưa có nhân viên</p>
                                                </div>
                                            ) : (
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-slate-100">
                                                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
                                                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Chức vụ</th>
                                                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Vai trò</th>
                                                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Liên hệ</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {employees.map(emp => (
                                                            <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                                                            {emp.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-slate-800">{emp.name}</p>
                                                                            <p className="text-xs text-slate-400">{emp.email}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-slate-600">
                                                                    {emp.jobTitle || <span className="text-slate-400 italic">—</span>}
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                                        {emp.role.name}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-slate-600">
                                                                    {emp.phone || <span className="text-slate-400">—</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'permissions' && (
                                        <div className="text-center py-8 text-slate-400">
                                            <Settings className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                            <p>Cấu hình quyền cho đơn vị</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingUnit
                                ? 'Sửa đơn vị'
                                : parentIdForNew
                                    ? 'Thêm đơn vị con'
                                    : 'Thêm đơn vị gốc'
                            }
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{formError}</div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Mã đơn vị *</label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="VD: TTVH-HN"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Loại *</label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TTVH">Trung tâm Vận hành</SelectItem>
                                        <SelectItem value="BCVH">Bưu cục Vận hành</SelectItem>
                                        <SelectItem value="BCP">Bưu cục Phát</SelectItem>
                                        <SelectItem value="DEPARTMENT">Phòng ban</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Tên đơn vị *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="VD: Trung tâm Vận hành Hà Nội"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Đơn vị cha</label>
                            <Select value={formData.parentId} onValueChange={(v) => setFormData({ ...formData, parentId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn đơn vị cha" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Không có (đơn vị gốc)</SelectItem>
                                    {parentOptions.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                            [{DEFAULT_TYPE_LABELS[u.type]?.substring(0, 4) || u.type}] {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Địa chỉ đơn vị"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Điện thoại</label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Số điện thoại"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Vĩ độ (Latitude)</label>
                                <Input
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    placeholder="VD: 21.0285"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Kinh độ (Longitude)</label>
                                <Input
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                    placeholder="VD: 105.8542"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} loading={submitting}>
                            {editingUnit ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {DialogComponent}
        </MainLayout>
    );
}
