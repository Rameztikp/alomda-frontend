"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "../../lib/supabaseClient";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const supabase = getSupabase();
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function check() {
            try {
                const { data } = await supabase.auth.getSession();
                const session = data.session;
                if (!session) {
                    router.replace("/login");
                    return;
                }
                if (mounted) setUserEmail(session.user.email || null);
            } catch (err) {
                console.error("Auth check error", err);
                router.replace("/login");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        check();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event: string, session: unknown) => {
                if (!session) router.replace("/login");
            }
        );

        return () => {
            mounted = false;
            try {
                subscription.unsubscribe();
            } catch {
                // ignore
            }
        };
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    جارٍ التحقق من جلسة المستخدم...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="text-right">
                        <h2 className="font-bold">لوحة التحكم</h2>
                        {userEmail && (
                            <div className="text-sm text-gray-600">
                                {userEmail}
                            </div>
                        )}
                    </div>

                    <nav className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="text-sm text-gray-700"
                        >
                            الرئيسية
                        </Link>
                        <Link
                            href="/dashboard/products"
                            className="text-sm text-gray-700"
                        >
                            المنتجات
                        </Link>
                        <Link
                            href="/dashboard/categories"
                            className="text-sm text-gray-700"
                        >
                            إدارة الأصناف
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="text-sm text-red-600"
                        >
                            تسجيل خروج
                        </button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">{children}</main>
        </div>
    );
}
