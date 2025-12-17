"use client";

import Link from "next/link";

export default function DashboardIndex() {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow text-right">
                <h1 className="text-2xl font-bold mb-2">
                    مرحباً بك في لوحة التحكم
                </h1>
                <p className="text-sm text-gray-600">
                    من هنا يمكنك إدارة محتوى الموقع.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/dashboard/categories"
                    className="block bg-white p-4 rounded shadow text-right"
                >
                    <h3 className="font-semibold">إدارة الأصناف</h3>
                    <p className="text-sm text-gray-500">
                        أضف أو احذف الأصناف المعروضة على الموقع.
                    </p>
                </Link>
            </div>
        </div>
    );
}
