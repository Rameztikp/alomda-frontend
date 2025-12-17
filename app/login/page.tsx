"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabaseClient";

export default function LoginPage() {
    const router = useRouter();
    const supabase = getSupabase();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signError } = await supabase.auth.signInWithPassword(
                {
                    email,
                    password,
                }
            );

            if (signError) {
                setError(signError.message);
                setLoading(false);
                return;
            }

            // نجاح تسجيل الدخول
            router.replace("/dashboard");
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "حدث خطأ غير متوقع");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4 text-right">
                    تسجيل الدخول
                </h1>

                {error && (
                    <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-right mb-1">
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            dir="ltr"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-right mb-1">
                            كلمة المرور
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-white px-4 py-2 rounded hover:opacity-95 disabled:opacity-60"
                        >
                            {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
                        </button>
                    </div>
                </form>

                <p className="mt-4 text-sm text-gray-500 text-right">
                    استخدم حساب Supabase (Email + Password).
                </p>
            </div>
        </div>
    );
}
