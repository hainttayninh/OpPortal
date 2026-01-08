'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';

export function Header() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { toggleSidebar, sidebarCollapsed } = useUIStore();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">
                        Hệ thống Quản lý Điều hành
                    </h1>
                    {user && (
                        <p className="text-sm text-slate-500">
                            {user.organizationUnit.name}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                    </span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                            <span className="text-sm font-bold text-white">
                                {user?.name.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.role}</p>
                        </div>
                    </button>

                    {dropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                <div className="border-b border-slate-100 px-4 py-3">
                                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        router.push('/profile');
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <User className="h-4 w-4" />
                                    Hồ sơ cá nhân
                                </button>
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        router.push('/settings');
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Settings className="h-4 w-4" />
                                    Cài đặt
                                </button>
                                <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
