'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { Eye, EyeOff, LogIn } from 'lucide-react';

// The form component - uses client-side URL parsing instead of useSearchParams
function LoginForm() {
    const router = useRouter();
    const { setUser } = useAuthStore();

    const [formData, setFormData] = React.useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Đăng nhập thất bại');
                return;
            }

            // Set user in store
            setUser(data.user);

            // Get redirect from URL using client-side parsing (avoids useSearchParams SSR issues)
            let redirect = '/dashboard';
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                redirect = params.get('redirect') || '/dashboard';
            }
            router.push(redirect);
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="relative w-full max-w-md border-slate-700 bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                        <span className="text-2xl font-bold text-white">OP</span>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                    Hệ thống Quản lý Điều hành
                </CardTitle>
                <CardDescription className="text-slate-500">
                    Đăng nhập để tiếp tục
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <Input
                        type="email"
                        label="Email"
                        placeholder="example@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="Mật khẩu"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-slate-600">
                            <input type="checkbox" className="rounded border-slate-300" />
                            Ghi nhớ đăng nhập
                        </label>
                        <a href="#" className="text-blue-600 hover:text-blue-700">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <Button type="submit" className="w-full" loading={loading}>
                        <LogIn className="h-4 w-4" />
                        Đăng nhập
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    <p>Phiên bản 1.0.0 • © 2026 OpPortal</p>
                </div>
            </CardContent>
        </Card>
    );
}

// Main login page content - exported for use by server component
export default function LoginPageContent() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

            {/* Gradient Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

            {/* Form */}
            <LoginForm />
        </div>
    );
}
