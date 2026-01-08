import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-blue-100 text-blue-700',
                secondary: 'bg-slate-100 text-slate-700',
                success: 'bg-emerald-100 text-emerald-700',
                warning: 'bg-amber-100 text-amber-700',
                danger: 'bg-red-100 text-red-700',
                info: 'bg-cyan-100 text-cyan-700',
                outline: 'border border-slate-200 text-slate-700',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

// Status badge mappings for workflow states
const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
    // Attendance statuses
    PENDING: 'warning',
    CONFIRMED: 'success',
    ADJUSTED: 'info',
    LOCKED: 'secondary',
    // Shift statuses
    DRAFT: 'secondary',
    ASSIGNED: 'info',
    ACTIVE: 'success',
    COMPLETED: 'default',
    // KPI statuses
    SUBMITTED: 'info',
    APPROVED: 'success',
    IN_PROGRESS: 'warning',
    EVALUATED: 'default',
    CLOSED: 'secondary',
    // Approval statuses
    REJECTED: 'danger',
    // User statuses
    INACTIVE: 'secondary',
    SUSPENDED: 'danger',
};

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
    status: string;
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
    const variant = statusVariants[status] || 'default';
    const displayStatus = status.replace(/_/g, ' ');

    return (
        <Badge variant={variant} className={className} {...props}>
            {displayStatus}
        </Badge>
    );
}

export { Badge, badgeVariants, StatusBadge };
