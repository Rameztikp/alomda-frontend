export interface Category {
  id: string;  // UUID
  name: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;  // UUID
  name: string;
  description?: string;  // يمكن أن يكون غير محدد
  price: number | null;  // يمكن أن يكون فارغاً في قاعدة البيانات
  image?: string;       // يمكن أن يكون غير محدد
  category_id?: string;  // UUID - يمكن أن يكون فارغاً
  created_at?: string;
  
  // حقول محسوبة/مرتبطة
  category?: Category;   // معلومات الصنف المرتبط
  
  // حقول متوافقة مع الكود الحالي
  name_ar?: string;     // للتوافق مع الكود الحالي
  description_ar?: string; // للتوافق مع الكود الحالي
  image_url?: string;   // للتوافق مع الكود الحالي (يستخدم image في قاعدة البيانات)
}
