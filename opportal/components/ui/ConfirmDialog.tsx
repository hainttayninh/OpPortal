'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'success' | 'info';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

const variantConfig = {
    danger: {
        icon: XCircle,
        iconClass: 'text-red-600',
        iconBgClass: 'bg-red-100',
        buttonClass: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
        icon: AlertTriangle,
        iconClass: 'text-amber-600',
        iconBgClass: 'bg-amber-100',
        buttonClass: 'bg-amber-600 hover:bg-amber-700',
    },
    success: {
        icon: CheckCircle,
        iconClass: 'text-emerald-600',
        iconBgClass: 'bg-emerald-100',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    },
    info: {
        icon: Info,
        iconClass: 'text-blue-600',
        iconBgClass: 'bg-blue-100',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    variant = 'danger',
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDialogProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
                        'bg-white rounded-2xl shadow-2xl',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
                        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
                        'duration-200'
                    )}
                >
                    <div className="p-6">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-full',
                                config.iconBgClass
                            )}>
                                <Icon className={cn('h-7 w-7', config.iconClass)} />
                            </div>
                        </div>

                        {/* Title */}
                        <DialogPrimitive.Title className="text-lg font-semibold text-center text-slate-900 mb-2">
                            {title}
                        </DialogPrimitive.Title>

                        {/* Description */}
                        {description && (
                            <DialogPrimitive.Description className="text-sm text-center text-slate-500 mb-6">
                                {description}
                            </DialogPrimitive.Description>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                {cancelText}
                            </Button>
                            <Button
                                className={cn('flex-1', config.buttonClass)}
                                onClick={handleConfirm}
                                loading={loading}
                            >
                                {confirmText}
                            </Button>
                        </div>
                    </div>

                    {/* Close button */}
                    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

// Hook for easier usage with async confirmation
export function useConfirmDialog() {
    const [state, setState] = React.useState<{
        open: boolean;
        title: string;
        description?: string;
        variant: 'danger' | 'warning' | 'success' | 'info';
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void | Promise<void>;
        loading: boolean;
    }>({
        open: false,
        title: '',
        description: undefined,
        variant: 'danger',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        onConfirm: () => { },
        loading: false,
    });

    const confirm = React.useCallback(
        (options: {
            title: string;
            description?: string;
            variant?: 'danger' | 'warning' | 'success' | 'info';
            confirmText?: string;
            cancelText?: string;
        }): Promise<boolean> => {
            return new Promise((resolve) => {
                setState({
                    open: true,
                    title: options.title,
                    description: options.description,
                    variant: options.variant || 'danger',
                    confirmText: options.confirmText || 'Xác nhận',
                    cancelText: options.cancelText || 'Hủy',
                    onConfirm: () => resolve(true),
                    loading: false,
                });
            });
        },
        []
    );

    const handleOpenChange = React.useCallback((open: boolean) => {
        if (!open) {
            setState((prev) => ({ ...prev, open: false }));
        }
    }, []);

    const DialogComponent = React.useMemo(
        () => (
            <ConfirmDialog
                open={state.open}
                onOpenChange={handleOpenChange}
                title={state.title}
                description={state.description}
                variant={state.variant}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
                onConfirm={state.onConfirm}
                loading={state.loading}
            />
        ),
        [state, handleOpenChange]
    );

    return { confirm, DialogComponent };
}
