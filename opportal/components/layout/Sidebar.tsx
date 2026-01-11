'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    Calendar,
    ClipboardCheck,
    Target,
    CheckSquare,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    roles?: string[];
}

const navItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Điều phối vận hành', href: '/operations', icon: Activity, roles: ['Admin', 'Manager', 'Leader'] },
    { title: 'Người dùng', href: '/users', icon: Users, roles: ['Admin', 'Manager'] },
    { title: 'Tổ chức', href: '/organization', icon: Building2, roles: ['Admin', 'Manager'] },
    { title: 'Ca làm việc', href: '/shifts', icon: Calendar },
    { title: 'Lịch làm việc', href: '/schedule', icon: Calendar, roles: ['Admin', 'Manager', 'Leader'] },
    { title: 'Chấm công', href: '/attendance', icon: ClipboardCheck },
    { title: 'KPI', href: '/kpi', icon: Target },
    { title: 'Phê duyệt', href: '/approvals', icon: CheckSquare, roles: ['Admin', 'Manager', 'Leader'] },
    { title: 'Nhật ký', href: '/audit-logs', icon: FileText, roles: ['Admin', 'Manager'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

    const filteredItems = navItems.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300',
                sidebarCollapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
                {!sidebarCollapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <span className="text-sm font-bold text-white">OP</span>
                        </div>
                        <span className="text-lg font-semibold text-white">OpPortal</span>
                    </Link>
                )}
                <button
                    onClick={toggleSidebarCollapsed}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-1">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25'
                                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                                        sidebarCollapsed && 'justify-center px-2'
                                    )}
                                    title={sidebarCollapsed ? item.title : undefined}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {!sidebarCollapsed && <span>{item.title}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Info */}
            {user && (
                <div className={cn(
                    'border-t border-slate-700 p-4',
                    sidebarCollapsed && 'flex justify-center'
                )}>
                    {sidebarCollapsed ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                            <span className="text-sm font-bold text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                                <span className="text-sm font-bold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                                <p className="truncate text-xs text-slate-400">{user.role}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}
