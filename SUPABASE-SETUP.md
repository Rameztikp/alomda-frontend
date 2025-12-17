# إعداد Supabase للواجهة الأمامية (Next.js)

ملخص سريع لإعداد الاتصال بـ Supabase وتشغيل لوحة التحكم العربية.

1. متغيرات البيئة (في `.env.local` على مستوى `alomda-frontend`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

2. تأكد أن التوثيق مفعّل وأن سياسة RLS على جدول `categories` تسمح بالعمليات للمستخدمين المصادقين (مثل `auth.uid() IS NOT NULL`).

3. الجداول:

-   `categories` (عمود `id`, `name`, `created_at`).

4. تشغيل تطبيق التطوير:

```bash
cd alomda-frontend
npm install
npm run dev
```

5. صفحات مهمة:

-   `/login` : صفحة تسجيل الدخول (البريد الإلكتروني + كلمة المرور)
-   `/dashboard` : لوحة محمية للمستخدم
-   `/dashboard/categories` : إدارة الأصناف (إضافة، عرض، حذف)

ملاحظات:

-   يوفّر الكود عميل Supabase في `lib/supabaseClient.ts` ويستخدم المتغيرات العامة (`NEXT_PUBLIC_*`).
-   الكود مُصمّم كـ RTL (لغة عربية) ويستخدم Tailwind CSS.
