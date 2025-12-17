"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "../../../lib/supabaseClient";

type Category = { id: number; name: string; created_at?: string };

export default function CategoriesPage() {
    const supabase = getSupabase();
    const [name, setName] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            console.debug("[categories] fetchCategories start");
            const { data, error: qErr } = await supabase
                .from("categories")
                .select("*")
                .order("created_at", { ascending: false });

            if (qErr) throw qErr;
            // normalize possible name fields for display
            const rows = (data || []) as any[];
            const normalized = rows.map((r) => ({
                id: r.id,
                name: r.name ?? r.title ?? r.label ?? "",
                created_at: r.created_at,
            }));
            setCategories(normalized as Category[]);
        } catch (err: unknown) {
            console.error("[categories] fetchCategories error", err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "فشل في جلب الأصناف");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("الرجاء إدخال اسم الصنف");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        console.log("[categories] handleAdd", { name });
        
        try {
            // Verify session first
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                throw new Error("يجب تسجيل الدخول أولاً");
            }
            
            console.debug('[categories] User session:', session.user?.email);
            
            // Try inserting with RLS (Row Level Security) compatible way
            const newCategory = { 
                name: name.trim()
                // تمت إزالة user_id لأنه غير موجود في الجدول
                // يمكنك إضافته إلى الجدول إذا كنت تريد ربط الأصناف بالمستخدمين
            };
            
            console.log('[categories] Attempting to insert:', newCategory);
            
            // إضافة سجل تصحيح قبل الإدراج
            console.log('Inserting category with data:', newCategory);
            
            const { data, error: insertError } = await supabase
                .from("categories")
                .insert([newCategory])
                .select()
                .single();
                
            if (insertError) {
                const errorDetails = insertError as unknown as {
                    message: string;
                    details?: string;
                    hint?: string;
                    code?: string;
                };
                
                console.error("[categories] Insert error details:", {
                    message: errorDetails.message,
                    details: errorDetails.details,
                    hint: errorDetails.hint,
                    code: errorDetails.code
                });
                throw new Error(errorDetails.message || 'فشل في إضافة الصنف');
            }
            
            console.log("[categories] Added category:", data);
            setName("");
            await fetchCategories();
            
        } catch (err: unknown) {
            console.error("[categories] handleAdd error", err);
            const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
            setError(`فشل في إضافة الصنف: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذا الصنف؟")) return;
        setLoading(true);
        try {
            const { error: delErr } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);
            if (delErr) throw delErr;
            await fetchCategories();
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "فشل في الحذف");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">إدارة الأصناف</h1>
                {debugInfo && (
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm overflow-auto">
                        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                )}

                <form
                    onSubmit={handleAdd}
                    className="flex gap-2 flex-row-reverse items-center"
                >
                    <input
                        dir="rtl"
                        placeholder="اسم الصنف"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 border rounded px-3 py-2"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-60"
                    >
                        إضافة صنف
                    </button>
                </form>

                {error && (
                    <div className="mt-3 text-sm text-red-700 bg-red-100 p-2 rounded">
                        {error}
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded shadow text-right">
                <h3 className="font-semibold mb-3">قائمة الأصناف</h3>

                {loading && (
                    <div className="text-sm text-gray-500">جارٍ التحميل...</div>
                )}

                {!loading && categories.length === 0 && (
                    <div className="text-gray-600">لا توجد أصناف بعد.</div>
                )}

                <ul className="space-y-2">
                    {categories.map((c) => (
                        <li
                            key={c.id}
                            className="flex items-center justify-between border rounded p-3"
                        >
                            <div className="text-right">{c.name}</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="text-sm text-red-600"
                                >
                                    حذف
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
