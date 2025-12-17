"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSupabase } from "@/lib/supabaseClient";

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: null as File | null,
    category_id: "",
    published: false
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert('حدث خطأ أثناء تحميل التصنيفات');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'file') return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;

  setIsSubmitting(true);

  try {
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("category_id", formData.category_id);
    formDataToSend.append("published", String(formData.published));

    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    const res = await fetch("/api/products", {
      method: "POST",
      body: formDataToSend,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "فشل إضافة المنتج");
    }

    router.push("/dashboard/products");
    router.refresh();
  } catch (error) {
    alert((error as Error).message);
  } finally {
    setIsSubmitting(false);
  }
};


  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إضافة منتج جديد</h1>
        <p className="text-gray-600">أدخل تفاصيل المنتج الجديد</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="name">اسم المنتج</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting || isLoading}
            placeholder="أدخل اسم المنتج"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">الوصف</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting || isLoading}
            placeholder="أدخل وصف المنتج"
            className="min-h-[100px]"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">السعر</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
              disabled={isSubmitting || isLoading}
              placeholder="0.00"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category_id">التصنيف</Label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">اختر التصنيف</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                لا توجد تصنيفات متاحة. يرجى إضافة تصنيف أولاً.
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">صورة المنتج</Label>
          <div className="mt-1 flex items-center">
            <label
              htmlFor="image-upload"
              className="cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
            >
              <span>اختر صورة</span>
              <input
                id="image-upload"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting || isLoading}
                className="sr-only"
              />
            </label>
            <p className="pl-2 text-sm text-gray-600">
              {formData.image ? formData.image.name : 'لم يتم اختيار صورة'}
            </p>
          </div>
          {previewUrl && (
            <div className="mt-2">
              <div className="w-40 h-40 relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, published: checked }))
              }
              disabled={isSubmitting || isLoading}
            />
            <Label htmlFor="published">
              {formData.published ? 'منشور' : 'مسودة'}
            </Label>
          </div>
          
          <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting || isLoading}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
