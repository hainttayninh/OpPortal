'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Table,
    StatusBadge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    type Column,
} from '@/components/ui';
import {
    FileCheck,
    Check,
    X,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface ApprovalRequest {
    id: string;
    type: 'ATTENDANCE_CORRECTION' | 'LEAVE_REQUEST' | 'SHIFT_CHANGE' | 'KPI_REVIEW';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    title: string;
    description?: string;
    beforeData?: Record<string, unknown>;
    afterData?: Record<string, unknown>;
    requestedBy: { id: string; name: string; email: string };
    approvedBy?: { id: string; name: string };
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
    ATTENDANCE_CORRECTION: 'Điều chỉnh chấm công',
    LEAVE_REQUEST: 'Xin nghỉ phép',
    SHIFT_CHANGE: 'Đổi ca làm việc',
    KPI_REVIEW: 'Đánh giá KPI',
};

const TYPE_COLORS: Record<string, string> = {
    ATTENDANCE_CORRECTION: 'bg-blue-100 text-blue-700',
    LEAVE_REQUEST: 'bg-purple-100 text-purple-700',
    SHIFT_CHANGE: 'bg-amber-100 text-amber-700',
    KPI_REVIEW: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_LABELS: Record<string, string> = {
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp',
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: 'text-slate-500',
    MEDIUM: 'text-blue-600',
    HIGH: 'text-amber-600',
    URGENT: 'text-red-600',
};

export default function ApprovalsClient() {
    const { user } = useAuthStore();
    const [requests, setRequests] = React.useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
    const [selectedRequest, setSelectedRequest] = React.useState<ApprovalRequest | null>(null);
    const [actionType, setActionType] = React.useState<'approve' | 'reject'>('approve');
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const fetchRequests = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') {
                params.set('status', filter.toUpperCase());
            }
            const response = await fetch(`/api/approvals?${params}`);
            if (response.ok) {
                const data = await response.json();
                // API returns 'approvals' property
                setRequests(data.approvals || []);
            }
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    React.useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async () => {
        if (!selectedRequest) return;
        setSubmitting(true);

        try {
            const response = await fetch(`/api/approvals?id=${selectedRequest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: actionType === 'approve' ? 'APPROVED' : 'REJECTED',
                    rejectionReason: actionType === 'reject' ? rejectionReason : undefined,
                }),
            });

            if (response.ok) {
                setActionDialogOpen(false);
                setSelectedRequest(null);
                setRejectionReason('');
                fetchRequests();
            }
        } catch (error) {
            console.error('Failed to process request:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const openActionDialog = (request: ApprovalRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setActionType(action);
        setRejectionReason('');
        setActionDialogOpen(true);
    };

    const openDetailDialog = (request: ApprovalRequest) => {
        setSelectedRequest(request);
        setDetailDialogOpen(true);
    };

    const filteredRequests = requests.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter.toUpperCase();
    });

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
    const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

    const isManager = user?.role === 'Admin' || user?.role === 'Manager';

    const columns: Column<ApprovalRequest>[] = [
        {
            key: 'title',
            header: 'Yêu cầu',
            render: (req) => (
                <div>
                    <p className="font-medium text-slate-900">{req.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(req.createdAt).toLocaleString('vi-VN')}
                    </p>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Loại',
            render: (req) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[req.type]}`}>
                    {TYPE_LABELS[req.type]}
                </span>
            ),
        },
        {
            key: 'requestedBy',
            header: 'Người yêu cầu',
            render: (req) => req.requestedBy.name,
        },
        {
            key: 'priority',
            header: 'Độ ưu tiên',
            render: (req) => (
                <span className={`font-medium ${PRIORITY_COLORS[req.priority]}`}>
                    {PRIORITY_LABELS[req.priority]}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (req) => <StatusBadge status={req.status} />,
        },
        {
            key: 'actions',
            header: '',
            className: 'w-32',
            render: (req) => (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => openDetailDialog(req)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="Xem chi tiết"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {isManager && req.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => openActionDialog(req, 'approve')}
                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-slate-500 hover:text-emerald-600"
                                title="Phê duyệt"
                            >
                                <Check className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => openActionDialog(req, 'reject')}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600"
                                title="Từ chối"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Phê duyệt</h1>
                        <p className="text-slate-500 mt-1">Quản lý các yêu cầu cần phê duyệt</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card
                        className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <FileCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
                                    <p className="text-sm text-slate-500">Tất cả</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-all ${filter === 'pending' ? 'ring-2 ring-amber-500' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                                    <p className="text-sm text-slate-500">Chờ duyệt</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-all ${filter === 'approved' ? 'ring-2 ring-emerald-500' : ''}`}
                        onClick={() => setFilter('approved')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{approvedCount}</p>
                                    <p className="text-sm text-slate-500">Đã duyệt</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-all ${filter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
                        onClick={() => setFilter('rejected')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                    <XCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{rejectedCount}</p>
                                    <p className="text-sm text-slate-500">Từ chối</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-blue-600" />
                            Danh sách yêu cầu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table
                            columns={columns}
                            data={filteredRequests}
                            keyExtractor={(req) => req.id}
                            loading={loading}
                            emptyMessage="Không có yêu cầu nào"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Chi tiết yêu cầu</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Tiêu đề</p>
                                    <p className="font-medium">{selectedRequest.title}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Loại</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[selectedRequest.type]}`}>
                                        {TYPE_LABELS[selectedRequest.type]}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Người yêu cầu</p>
                                    <p className="font-medium">{selectedRequest.requestedBy.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Thời gian</p>
                                    <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Độ ưu tiên</p>
                                    <span className={`font-medium ${PRIORITY_COLORS[selectedRequest.priority]}`}>
                                        {PRIORITY_LABELS[selectedRequest.priority]}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Trạng thái</p>
                                    <StatusBadge status={selectedRequest.status} />
                                </div>
                            </div>
                            {selectedRequest.description && (
                                <div>
                                    <p className="text-sm text-slate-500">Mô tả</p>
                                    <p className="font-medium">{selectedRequest.description}</p>
                                </div>
                            )}
                            {selectedRequest.approvedBy && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Người phê duyệt</p>
                                        <p className="font-medium">{selectedRequest.approvedBy.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Thời gian phê duyệt</p>
                                        <p className="font-medium">
                                            {selectedRequest.approvedAt
                                                ? new Date(selectedRequest.approvedAt).toLocaleString('vi-VN')
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {selectedRequest.rejectionReason && (
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <p className="text-sm text-red-600 font-medium">Lý do từ chối:</p>
                                    <p className="text-red-700">{selectedRequest.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Action Dialog */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve' ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedRequest && (
                            <div className="p-4 bg-slate-50 rounded-lg mb-4">
                                <p className="font-medium">{selectedRequest.title}</p>
                                <p className="text-sm text-slate-500">Bởi: {selectedRequest.requestedBy.name}</p>
                            </div>
                        )}

                        {actionType === 'approve' ? (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                                <p className="text-emerald-700">Xác nhận phê duyệt yêu cầu này?</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                    <p className="text-red-700">Bạn sắp từ chối yêu cầu này</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Lý do từ chối <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
                                        placeholder="Nhập lý do từ chối..."
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleAction}
                            loading={submitting}
                            className={actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                            disabled={actionType === 'reject' && !rejectionReason.trim()}
                        >
                            {actionType === 'approve' ? 'Phê duyệt' : 'Từ chối'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
